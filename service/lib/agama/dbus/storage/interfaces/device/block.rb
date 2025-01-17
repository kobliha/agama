# frozen_string_literal: true

# Copyright (c) [2023-2024] SUSE LLC
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

require "dbus"

module Agama
  module DBus
    module Storage
      module Interfaces
        module Device
          # Interface for block devices.
          #
          # @note This interface is intended to be included by {Agama::DBus::Storage::Device} if
          #   needed.
          module Block
            # Whether this interface should be implemented for the given device.
            #
            # @note Block devices implement this interface.
            #
            # @param storage_device [Y2Storage::Device]
            # @return [Boolean]
            def self.apply?(storage_device)
              storage_device.is?(:blk_device)
            end

            BLOCK_INTERFACE = "org.opensuse.Agama.Storage1.Block"
            private_constant :BLOCK_INTERFACE

            # Name of the block device
            #
            # @return [String] e.g., "/dev/sda"
            def block_name
              storage_device.name
            end

            # Whether the block device is currently active
            #
            # @return [Boolean]
            def block_active
              storage_device.active?
            end

            # Name of the udev by-id links
            #
            # @return [Array<String>]
            def block_udev_ids
              storage_device.udev_ids
            end

            # Name of the udev by-path links
            #
            # @return [Array<String>]
            def block_udev_paths
              storage_device.udev_paths
            end

            # Size of the block device in bytes
            #
            # @return [Integer]
            def block_size
              storage_device.size.to_i
            end

            # Size of the space that could be theoretically reclaimed by shrinking the device.
            #
            # @return [Integer]
            def block_recoverable_size
              storage_device.recoverable_size.to_i
            end

            # Name of the currently installed systems
            #
            # @return [Array<String>]
            def block_systems
              return @systems if @systems

              filesystems = storage_device.descendants.select { |d| d.is?(:filesystem) }
              @systems = filesystems.map(&:system_name).compact
            end

            def self.included(base)
              base.class_eval do
                dbus_interface BLOCK_INTERFACE  do
                  dbus_reader :block_name, "s", dbus_name: "Name"
                  dbus_reader :block_active, "b", dbus_name: "Active"
                  dbus_reader :block_udev_ids, "as", dbus_name: "UdevIds"
                  dbus_reader :block_udev_paths, "as", dbus_name: "UdevPaths"
                  dbus_reader :block_size, "t", dbus_name: "Size"
                  dbus_reader :block_recoverable_size, "t", dbus_name: "RecoverableSize"
                  dbus_reader :block_systems, "as", dbus_name: "Systems"
                end
              end
            end
          end
        end
      end
    end
  end
end
