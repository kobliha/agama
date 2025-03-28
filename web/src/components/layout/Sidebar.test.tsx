/*
 * Copyright (c) [2024-2025] SUSE LLC
 *
 * All Rights Reserved.
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option)
 * any later version.
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
import { installerRender } from "~/test-utils";
import Sidebar from "./Sidebar";
import { Product } from "~/types/software";
import { useProduct } from "~/queries/software";

const tw: Product = {
  id: "Tumbleweed",
  name: "openSUSE Tumbleweed",
  registration: false,
};

const sle: Product = {
  id: "sle",
  name: "SLE",
  registration: true,
};

let selectedProduct: Product;

jest.mock("~/queries/software", () => ({
  ...jest.requireActual("~/queries/software"),
  useProduct: (): ReturnType<typeof useProduct> => {
    return {
      products: [tw, sle],
      selectedProduct,
    };
  },
}));

jest.mock("~/router", () => ({
  rootRoutes: () => [
    { path: "/" },
    { path: "/main", handle: { name: "Main", alsoActiveOn: ["/"] } },
    { path: "/l10n", handle: { name: "L10n" } },
    { path: "/hidden" },
    {
      path: "/registration",
      handle: { name: "Registration", needsRegistrableProduct: true },
    },
  ],
}));

describe("Sidebar", () => {
  describe("when product is registrable", () => {
    beforeEach(() => {
      selectedProduct = sle;
    });

    it("renders a navigation including all root routes with handle object", () => {
      installerRender(<Sidebar />);
      const mainNavigation = screen.getByRole("navigation");
      const mainNavigationLinks = within(mainNavigation).getAllByRole("link");
      expect(mainNavigationLinks.length).toBe(3);
      screen.getByRole("link", { name: "Main" });
      screen.getByRole("link", { name: "L10n" });
      screen.getByRole("link", { name: "Registration" });
    });
  });

  describe("when product is not registrable", () => {
    beforeEach(() => {
      selectedProduct = tw;
    });

    it("renders a navigation including all root routes with handle object, except ones set as needsRegistrableProduct", () => {
      installerRender(<Sidebar />);
      const mainNavigation = screen.getByRole("navigation");
      const mainNavigationLinks = within(mainNavigation).getAllByRole("link");
      expect(mainNavigationLinks.length).toBe(2);
      const mainRoute = screen.getByRole("link", { name: "Main" });
      expect(mainRoute).toHaveClass("pf-m-current");
      screen.getByRole("link", { name: "L10n" });
    });
  });
});
