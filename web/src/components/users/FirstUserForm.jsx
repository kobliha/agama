/*
 * Copyright (c) [2022-2023] SUSE LLC
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

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { _ } from "~/i18n";
import { useCancellablePromise } from "~/utils";
import { useInstallerClient } from "~/context/installer";
import {
  Alert,
  Checkbox,
  Form,
  FormGroup,
  TextInput,
  Menu,
  MenuContent,
  MenuList,
  MenuItem
} from "@patternfly/react-core";

import { Loading } from "~/components/layout";
import { PasswordAndConfirmationInput, If, Page } from '~/components/core';
import { suggestUsernames } from '~/components/users/utils';

const UsernameSuggestions = ({ entries, onSelect, setInsideDropDown, focusedIndex = -1 }) => {
  return (
    <Menu
      aria-label={_("Username suggestion dropdown")}
      className="first-username-dropdown"
      onMouseEnter={() => setInsideDropDown(true)}
      onMouseLeave={() => setInsideDropDown(false)}
    >
      <MenuContent>
        <MenuList>
          {entries.map((suggestion, index) => (
            <MenuItem
              key={index}
              itemId={index}
              isFocused={focusedIndex === index}
              onClick={() => onSelect(suggestion)}
            >
              { /* TRANSLATORS: dropdown username suggestions */}
              {_("Use suggested username")} <b>{suggestion}</b>
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );
};

// TODO: create an object for errors using the input name as key and show them
// close to the related input.
// TODO: extract the suggestions logic.
export default function FirstUserForm() {
  const client = useInstallerClient();
  const { cancellablePromise } = useCancellablePromise();
  const [state, setState] = useState({});
  const [errors, setErrors] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [insideDropDown, setInsideDropDown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const usernameInputRef = useRef();
  const navigate = useNavigate();
  const passwordRef = useRef();

  useEffect(() => {
    cancellablePromise(client.users.getUser()).then(userValues => {
      setState({
        load: true,
        user: userValues,
        isEditing: userValues.username !== ""
      });
    });
  }, [client.users, cancellablePromise]);

  useEffect(() => {
    return client.users.onUsersChange(({ firstUser }) => {
      if (firstUser !== undefined) {
        setState({ ...state, user: firstUser });
      }
    });
  }, [client.users, state]);

  useEffect(() => {
    if (showSuggestions) {
      setFocusedIndex(-1);
    }
  }, [showSuggestions]);

  if (!state.load) return <Loading />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    const passwordInput = passwordRef.current;

    if (!passwordInput?.validity.valid) {
      setErrors([passwordInput?.validationMessage]);
      return;
    }

    const user = {};
    const formData = new FormData(e.target);

    // FIXME: have a look to https://www.patternfly.org/components/forms/form#form-state
    formData.entries().reduce((user, [key, value]) => {
      user[key] = value;
      return user;
    }, user);

    // Preserve current password value if the user was not editing it.
    if (state.isEditing && user.password === "") delete user.password;
    delete user.passwordConfirmation;
    user.autologin = !!user.autologin;

    const { result, issues = [] } = await client.users.setUser({ ...state.user, ...user });
    if (!result || issues.length) {
      // FIXME: improve error handling. See client.
      setErrors(issues.length ? issues : [_("Please, try again.")]);
    } else {
      navigate("..");
    }
  };

  const onSuggestionSelected = (suggestion) => {
    if (!usernameInputRef.current) return;
    usernameInputRef.current.value = suggestion;
    usernameInputRef.current.focus();
    setInsideDropDown(false);
    setShowSuggestions(false);
  };

  const renderSuggestions = (e) => {
    if (suggestions.length === 0) return;
    setShowSuggestions(e.target.value === "");
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault(); // Prevent page scrolling
        renderSuggestions(e);
        setFocusedIndex((prevIndex) => (prevIndex + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault(); // Prevent page scrolling
        renderSuggestions(e);
        setFocusedIndex((prevIndex) => (prevIndex - (prevIndex === -1 ? 0 : 1) + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        if (focusedIndex >= 0) {
          e.preventDefault();
          onSuggestionSelected(suggestions[focusedIndex]);
        }
        break;
      case 'Escape':
      case 'Tab':
        setShowSuggestions(false);
        break;
      default:
        renderSuggestions(e);
        break;
    }
  };

  return (
    <>
      <Page.MainContent>
        <Form id="firstUserForm" onSubmit={onSubmit}>
          {errors.length > 0 &&
            <Alert variant="warning" isInline title={_("Something went wrong")}>
              {errors.map((e, i) => <p key={`error_${i}`}>{e}</p>)}
            </Alert>}

          <FormGroup fieldId="userFullName" label={_("Full name")}>
            <TextInput
              id="userFullName"
              name="fullName"
              aria-label={_("User full name")}
              defaultValue={state.user.fullName}
              label={_("User full name")}
              onBlur={(e) => setSuggestions(suggestUsernames(e.target.value))}
            />
          </FormGroup>

          <FormGroup
            className="first-username-wrapper"
            fieldId="userName"
            label={_("Username")}
            isRequired
          >
            <TextInput
              id="userName"
              name="userName"
              aria-label={_("Username")}
              ref={usernameInputRef}
              defaultValue={state.user.userName}
              label={_("Username")}
              isRequired
              onFocus={renderSuggestions}
              onKeyDown={handleKeyDown}
              onBlur={() => !insideDropDown && setShowSuggestions(false)}
            />
            <If
              condition={showSuggestions}
              then={
                <UsernameSuggestions
                  entries={suggestions}
                  onSelect={onSuggestionSelected}
                  setInsideDropDown={setInsideDropDown}
                  focusedIndex={focusedIndex}
                />
              }
            />
          </FormGroup>

          <PasswordAndConfirmationInput
            inputRef={passwordRef}
            showErrors={false}
          />

          <Checkbox
            aria-label={_("user autologin")}
            id="autologin"
            name="autologin"
            // TRANSLATORS: check box label
            label={_("Auto-login")}
            defaultChecked={state.user.autologin}
          />
        </Form>
      </Page.MainContent>

      <Page.NextActions>
        <Page.CancelAction />
        <Page.Action type="submit" form="firstUserForm">
          {_("Accept")}
        </Page.Action>
      </Page.NextActions>
    </>
  );
}
