/*
 * Copyright (c) [2024] SUSE LLC
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
import { screen, within } from "@testing-library/react";
import { plainRender } from "~/test-utils";
import { ProposalFileSystemsSection } from "~/components/storage";

const props = {
  settings: {},
  isLoading: false,
  onChange: jest.fn()
};

describe("ProposalFileSystemsSection", () => {
  it("renders a section holding file systems related stuff", () => {
    plainRender(<ProposalFileSystemsSection {...props} />);
    screen.getByRole("region", { name: "File systems" });
    screen.getByRole("grid", { name: /mount points/ });
  });

  it("requests a volume change when onChange callback is triggered", async () => {
    const { user } = plainRender(<ProposalFileSystemsSection {...props} />);
    const button = screen.getByRole("button", { name: "Actions" });

    await user.click(button);

    const menu = screen.getByRole("menu");
    const reset = within(menu).getByRole("menuitem", { name: /Reset/ });

    await user.click(reset);

    expect(props.onChange).toHaveBeenCalledWith(
      { volumes: expect.any(Array) }
    );
  });
});
