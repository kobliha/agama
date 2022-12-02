/*
 * Copyright (c) [2022] SUSE LLC
 *
 * All Rights Reserved.
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of version 2 of the GNU General Public License as published
 * by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, contact SUSE LLC.
 *
 * To contact SUSE LLC about this file by physical or electronic mail, you may
 * find current contact information at www.suse.com.
 */

import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { installerRender } from "@/test-utils";
import { ProposalSettingsSection } from "@components/storage";

const FakeProposalSettingsForm = ({ id, onSubmit }) => {
  const accept = (e) => {
    e.preventDefault();
    onSubmit({});
  };

  return <form id={id} onSubmit={accept} aria-label="Settings form" />;
}

jest.mock("@components/storage/ProposalSettingsForm", () => FakeProposalSettingsForm);

let candidateDevices = ["/dev/sda"];
let encryptionPassword = "";
let lvm = false;
let volumes = [{ mountPoint: "/test1" }, { mountPoint: "/test2" }];

const proposal = {
  candidateDevices,
  encryptionPassword,
  lvm,
  volumes
};

it("renders the list of the volumes to create", () => {
  installerRender(<ProposalSettingsSection proposal={proposal} />);

  screen.getByText(/Create the following file systems/);
  screen.getByText("/test1");
  screen.getByText("/test2");
});

it("renders an icon for configuring the settings", () => {
  installerRender(<ProposalSettingsSection proposal={proposal} />);

  screen.getByRole("button", { name: "Settings section action icon" });
});

it("does not show the popup by default", async () => {
  installerRender(<ProposalSettingsSection proposal={proposal} />);

  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

it("shows the popup with the form when the icon is clicked", async () => {
  const { user } = installerRender(<ProposalSettingsSection proposal={proposal} />);

  const button = screen.getByRole("button", { name: "Settings section action icon" });
  await user.click(button);

  await screen.findByRole("dialog");
  screen.getByRole("form", { name: "Settings form" });
});

it("closes the popup without submitting the form when cancel is clicked", async () => {
  const calculateFn = jest.fn();

  const { user } = installerRender(<ProposalSettingsSection proposal={proposal} calculateProposal={calculateFn} />);

  const button = screen.getByRole("button", { name: "Settings section action icon" });
  await user.click(button);

  const popup = await screen.findByRole("dialog");
  const cancel = within(popup).getByRole("button", { name: "Cancel" });
  await user.click(cancel);

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(calculateFn).not.toHaveBeenCalled();
});

it("closes the popup and submits the form when accept is clicked", async () => {
  const calculateFn = jest.fn();

  const { user } = installerRender(<ProposalSettingsSection proposal={proposal} calculateProposal={calculateFn} />);

  const button = screen.getByRole("button", { name: "Settings section action icon" });
  await user.click(button);

  const popup = await screen.findByRole("dialog");
  const accept = within(popup).getByRole("button", { name: "Accept" });
  await user.click(accept);

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(calculateFn).toHaveBeenCalled();
});

describe("when lvm and encryption are not selected", () => {
  beforeEach(() => {
    lvm = false;
    encryptionPassword = "";
  });

  it("renders the proper description for the selected settings", () => {
    installerRender(<ProposalSettingsSection proposal={proposal} />);

    screen.getByText(/Create file systems over partitions/);
  });
});
