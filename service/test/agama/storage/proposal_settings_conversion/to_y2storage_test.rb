# frozen_string_literal: true

# Copyright (c) [2023] SUSE LLC
#
# All Rights Reserved.
#
# This program is free software; you can redistribute it and/or modify it
# under the terms of version 2 of the GNU General Public License as published
# by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
# FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along
# with this program; if not, contact SUSE LLC.
#
# To contact SUSE LLC about this file by physical or electronic mail, you may
# find current contact information at www.suse.com.

require_relative "../../../test_helper"
require_relative "../storage_helpers"
require "agama/storage/proposal_settings_conversion/to_y2storage"
require "agama/storage/proposal_settings"
require "agama/config"
require "y2storage"

describe Agama::Storage::ProposalSettingsConversion::ToY2Storage do
  include Agama::RSpec::StorageHelpers

  subject { described_class.new(settings, config: config) }

  let(:config) { Agama::Config.new }

  describe "#convert" do
    let(:settings) do
      Agama::Storage::ProposalSettings.new.tap do |settings|
        settings.boot_device = "/dev/sda"
        settings.lvm.enabled = true
        settings.lvm.system_vg_devices = ["/dev/sda", "/dev/sdb"]
        settings.encryption.password = "notsecret"
        settings.encryption.method = Y2Storage::EncryptionMethod::LUKS2
        settings.encryption.pbkd_function = Y2Storage::PbkdFunction::ARGON2ID
        settings.space.policy = :custom
        settings.space.actions = { "/dev/sda" => :force_delete }
        volume = Agama::Storage::Volume.new("/test").tap { |v| v.device = "/dev/sdc" }
        settings.volumes = [volume]
      end
    end

    it "converts the settings to Y2Storage settings" do
      y2storage_settings = subject.convert

      expect(y2storage_settings).to be_a(Y2Storage::ProposalSettings)
      expect(y2storage_settings).to have_attributes(
        candidate_devices:   contain_exactly("/dev/sda", "/dev/sdb"),
        root_device:         "/dev/sda",
        swap_reuse:          :none,
        lvm:                 true,
        separate_vgs:        true,
        lvm_vg_reuse:        false,
        encryption_password: "notsecret",
        encryption_method:   Y2Storage::EncryptionMethod::LUKS2,
        encryption_pbkdf:    Y2Storage::PbkdFunction::ARGON2ID,
        space_settings:      an_object_having_attributes(
          strategy: :bigger_resize,
          actions:  { "/dev/sda" => :force_delete }
        ),
        volumes:             include(an_object_having_attributes(mount_point: "/test"))
      )
    end

    context "candidate devices conversion" do
      context "when LVM is not set" do
        before do
          settings.lvm.enabled = false
          settings.lvm.system_vg_devices = ["/dev/sdb"]
        end

        context "and there is a boot device" do
          before do
            settings.boot_device = "/dev/sda"
          end

          it "uses the boot device as candidate device" do
            y2storage_settings = subject.convert

            expect(y2storage_settings).to have_attributes(
              candidate_devices: contain_exactly("/dev/sda")
            )
          end
        end

        context "and there is no boot device" do
          before do
            settings.boot_device = nil
          end

          it "does not set candidate devices" do
            y2storage_settings = subject.convert

            expect(y2storage_settings).to have_attributes(
              candidate_devices: be_empty
            )
          end
        end
      end

      context "when LVM is set but no system VG devices are indicated" do
        before do
          settings.lvm.enabled = true
          settings.lvm.system_vg_devices = []
        end

        context "and there is a boot device" do
          before do
            settings.boot_device = "/dev/sda"
          end

          it "uses the boot device as candidate device" do
            y2storage_settings = subject.convert

            expect(y2storage_settings).to have_attributes(
              candidate_devices: contain_exactly("/dev/sda")
            )
          end
        end

        context "and there is no boot device" do
          before do
            settings.boot_device = nil
          end

          it "does not set candidate device" do
            y2storage_settings = subject.convert

            expect(y2storage_settings).to have_attributes(
              candidate_devices: be_empty
            )
          end
        end
      end

      context "when LVM is set and some system VG devices are indicated" do
        before do
          settings.lvm.enabled = true
          settings.lvm.system_vg_devices = ["/dev/sdb", "/dev/sdc"]
        end

        it "uses the system VG devices as candidate devices" do
          y2storage_settings = subject.convert

          expect(y2storage_settings).to have_attributes(
            candidate_devices: contain_exactly("/dev/sdb", "/dev/sdc")
          )
        end
      end
    end

    context "space policy conversion" do
      before do
        mock_storage(devicegraph: "staging-plain-partitions.yaml")
      end

      context "when the space policy is set to :delete" do
        before do
          settings.space.policy = :delete
        end

        it "generates delete actions for all used devices" do
          y2storage_settings = subject.convert

          expect(y2storage_settings.space_settings).to have_attributes(
            strategy: :bigger_resize,
            actions:  {
              "/dev/sda1" => :force_delete,
              "/dev/sda2" => :force_delete,
              "/dev/sda3" => :force_delete,
              "/dev/sdb"  => :force_delete,
              "/dev/sdc"  => :force_delete
            }
          )
        end
      end

      context "when the space policy is set to :resize" do
        before do
          settings.space.policy = :resize
        end

        it "generates resize actions for all used devices" do
          y2storage_settings = subject.convert

          expect(y2storage_settings.space_settings).to have_attributes(
            strategy: :bigger_resize,
            actions:  {
              "/dev/sda1" => :resize,
              "/dev/sda2" => :resize,
              "/dev/sda3" => :resize,
              "/dev/sdb"  => :resize,
              "/dev/sdc"  => :resize
            }
          )
        end
      end

      context "when the space policy is set to :keep" do
        before do
          settings.space.policy = :keep
        end

        it "generates no actions" do
          y2storage_settings = subject.convert

          expect(y2storage_settings.space_settings).to have_attributes(
            strategy: :bigger_resize,
            actions:  {}
          )
        end
      end
    end

    context "volumes conversion" do
      let(:config) do
        Agama::Config.new(
          {
            "storage" => {
              "volume_templates" => [
                {
                  "mount_path" => "/",
                  "outline"    => { "required" => true }
                },
                {
                  "mount_path" => "/home",
                  "outline"    => { "required" => false }
                },
                {
                  "mount_path" => "swap",
                  "outline"    => { "required" => false }
                },
                {
                  "outline" => { "required" => false }
                }
              ]
            }
          }
        )
      end

      it "includes missing config templates as not proposed volumes" do
        y2storage_settings = subject.convert

        expect(y2storage_settings.volumes).to contain_exactly(
          an_object_having_attributes(mount_point: "/", proposed: false),
          an_object_having_attributes(mount_point: "/home", proposed: false),
          an_object_having_attributes(mount_point: "swap", proposed: false),
          an_object_having_attributes(mount_point: "/test", proposed: true)
        )
      end

      it "sets the fallback for min and max sizes" do
        volume = Agama::Storage::Volume.new("/test").tap do |vol|
          vol.outline.min_size_fallback_for = ["/home", "swap"]
          vol.outline.max_size_fallback_for = ["swap"]
        end

        settings.volumes = [volume]

        y2storage_settings = subject.convert

        expect(y2storage_settings.volumes).to contain_exactly(
          an_object_having_attributes(
            mount_point:               "/",
            fallback_for_min_size:     nil,
            fallback_for_max_size:     nil,
            fallback_for_max_size_lvm: nil
          ),
          an_object_having_attributes(
            mount_point:               "/home",
            fallback_for_min_size:     "/test",
            fallback_for_max_size:     nil,
            fallback_for_max_size_lvm: nil
          ),
          an_object_having_attributes(
            mount_point:               "swap",
            fallback_for_min_size:     "/test",
            fallback_for_max_size:     "/test",
            fallback_for_max_size_lvm: "/test"
          ),
          an_object_having_attributes(
            mount_point:               "/test",
            fallback_for_min_size:     nil,
            fallback_for_max_size:     nil,
            fallback_for_max_size_lvm: nil
          )
        )
      end
    end
  end
end
