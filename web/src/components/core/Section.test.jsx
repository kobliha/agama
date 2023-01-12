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

import React, { useState } from "react";
import { screen } from "@testing-library/react";
import { installerRender } from "@test-utils/renderers";
import { Section } from "@components/core";

describe("Section", () => {
  it("renders given title", () => {
    installerRender(<Section title="Awesome settings" />);

    screen.getByRole("heading", { name: "Awesome settings" });
  });

  it("renders given description", () => {
    installerRender(
      <Section title="Awesome settings" description="Intended to perform awesome tweaks" />
    );

    screen.getByText("Intended to perform awesome tweaks");
  });

  it("renders given errors", () => {
    installerRender(
      <Section title="Awesome settings" errors={[{ message: "Something went wrong" }]} />
    );

    screen.getByText("Something went wrong");
  });

  describe("when onActionClick callback is given", () => {
    it("renders a link for section settings", () => {
      installerRender(
        <Section title="Awesome settings" onActionClick={() => null} />
      );

      screen.getByLabelText("Section settings");
    });

    it("triggers the action when user clicks on it", async () => {
      const AwesomeSection = () => {
        const [showInput, setShowInput] = useState(false);
        return (
          <Section title="Awesome settings" onActionClick={() => setShowInput(true)}>
            { showInput &&
              <>
                <label htmlFor="awesome-input">Awesome input</label>
                <input id="awesome-input" type="text" />
              </> }
          </Section>
        );
      };

      const { user } = installerRender(<AwesomeSection />);

      let inputText = screen.queryByRole("textbox", { name: "Awesome input" });
      expect(inputText).not.toBeInTheDocument();

      const actionLink = screen.getByLabelText("Section settings");

      await user.click(actionLink);

      inputText = screen.queryByRole("textbox", { name: "Awesome input" });
      expect(inputText).toBeInTheDocument();
    });
  });
});
