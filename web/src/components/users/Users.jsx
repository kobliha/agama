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

import React, { useEffect, useState } from "react";

import { useInstallerClient } from "@context/installer";
import { Section } from "@components/core";
import { FirstUser, RootPassword, RootSSHKey } from "@components/users";
import { Icon } from "@components/layout";

export default function Users({ showErrors }) {
  const [errors, setErrors] = useState([]);
  const { users: usersClient } = useInstallerClient();

  useEffect(() => {
    usersClient.getValidationErrors().then(setErrors);
    return usersClient.onValidationChange(setErrors);
  }, [usersClient]);

  return (
    <>
      <Section
        key="users"
        title="Users"
        icon={() => <Icon name="manage_accounts" />}
        errors={showErrors ? errors : []}
      >
        <RootPassword />
        <RootSSHKey />
        <FirstUser />
      </Section>
    </>
  );
}
