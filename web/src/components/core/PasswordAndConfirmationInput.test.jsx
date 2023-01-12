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
import { screen } from "@testing-library/react";
import { plainRender } from "@test-utils/renderers";
import PasswordAndConfirmationInput from "./PasswordAndConfirmationInput";

describe("when the passwords do not match", () => {
  it("displays a warning", async () => {
    const password = "";
    const { user } = plainRender(
      <PasswordAndConfirmationInput value={password} />
    );

    const passwordInput = screen.getByLabelText("Password");
    user.type(passwordInput, "123456");
    await screen.findByText("Passwords do not match");
  });
});

it("uses the given password value for confirmation too", async () => {
  plainRender(
    <PasswordAndConfirmationInput value="12345" />
  );

  const passwordInput = screen.getByLabelText("Password");
  const confirmationInput = screen.getByLabelText("Password confirmation");

  expect(passwordInput.value).toEqual("12345");
  expect(passwordInput.value).toEqual(confirmationInput.value);
});

it("disables both, password and confirmation, when isDisabled prop is given", async () => {
  plainRender(
    <PasswordAndConfirmationInput value="12345" isDisabled />
  );

  const passwordInput = screen.getByLabelText("Password");
  const confirmationInput = screen.getByLabelText("Password confirmation");

  expect(passwordInput).toBeDisabled();
  expect(confirmationInput).toBeDisabled();
});
