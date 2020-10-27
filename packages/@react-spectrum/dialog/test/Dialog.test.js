/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {act, fireEvent, render} from '@testing-library/react';
import {Dialog} from '../';
import {DialogContext} from '../src/context';
import {Header} from '@react-spectrum/view';
import {Heading} from '@react-spectrum/text';
import {ModalProvider} from '@react-aria/overlays';
import React from 'react';

describe('Dialog', function () {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(() => cb(), 0));
  });

  afterEach(() => {
    jest.runAllTimers();
    window.requestAnimationFrame.mockRestore();
  });

  it('does not auto focus anything inside', function () {
    let {getByRole} = render(
      <Dialog>
        <input data-testid="input1" />
        <input data-testid="input2" />
      </Dialog>
    );

    let dialog = getByRole('dialog');
    expect(document.activeElement).toBe(dialog);
    // if there is no heading, then we shouldn't auto label
    expect(dialog).not.toHaveAttribute('aria-labelledby');
  });

  it('auto focuses the dialog itself if there is no focusable child', function () {
    let {getByRole} = render(
      <Dialog>
        contents
      </Dialog>
    );

    let dialog = getByRole('dialog');
    expect(document.activeElement).toBe(dialog);
  });

  it('autofocuses any element that has autofocus inside', function () {
    let {getByTestId} = render(
      <Dialog>
        <input data-testid="input1" />
        <input data-testid="input2" autoFocus />
      </Dialog>
    );

    let input2 = getByTestId('input2');
    expect(document.activeElement).toBe(input2);
  });

  it('contains focus within the dialog', function () {
    let {getByRole, getByTestId} = render(
      <Dialog>
        <input data-testid="input1" />
        <input data-testid="input2" />
      </Dialog>
    );

    let dialog = getByRole('dialog');
    let input1 = getByTestId('input1');
    let input2 = getByTestId('input2');
    expect(document.activeElement).toBe(dialog);

    act(() => {
      fireEvent.keyDown(document.activeElement, {key: 'Tab'});
      jest.runAllTimers();
    });

    expect(document.activeElement).toBe(input1);

    act(() => {
      fireEvent.keyDown(document.activeElement, {key: 'Tab'});
      jest.runAllTimers();
    });

    expect(document.activeElement).toBe(input2);

    act(() => {
      fireEvent.keyDown(document.activeElement, {key: 'Tab'});
      jest.runAllTimers();
    });
    expect(document.activeElement).toBe(input1);
  });

  it('should be labelled by its header', function () {
    let {getByRole} = render(
      <ModalProvider>
        <DialogContext.Provider value={{type: 'modal'}}>
          <Dialog>
            <Heading><Header>The Title</Header></Heading>
          </Dialog>
        </DialogContext.Provider>
      </ModalProvider>
    );

    let dialog = getByRole('dialog');
    let heading = getByRole('heading');

    let id = heading.id;
    expect(dialog).toHaveAttribute('aria-labelledby', id);
  });

  it('if aria-labelledby is specified, then that takes precedence over the title', function () {
    let {getByRole} = render(
      <div>
        <ModalProvider>
          <DialogContext.Provider value={{type: 'modal'}}>
            <Dialog aria-labelledby="batman">
              <Heading><Header>The Title</Header></Heading>
            </Dialog>
          </DialogContext.Provider>
        </ModalProvider>
        <span id="batman">Good grammar is essential, Robin.</span>
      </div>
    );

    let dialog = getByRole('dialog');
    let heading = getByRole('heading');

    let id = heading.id;
    expect(dialog).not.toHaveAttribute('aria-labelledby', id);
    expect(dialog).toHaveAttribute('aria-labelledby', 'batman');
  });

  it('if aria-label is specified, then that takes precedence over the title', function () {
    let {getByRole} = render(
      <ModalProvider>
        <DialogContext.Provider value={{type: 'modal'}}>
          <Dialog aria-label="robin">
            <Heading><Header>The Title</Header></Heading>
          </Dialog>
        </DialogContext.Provider>
      </ModalProvider>
    );

    let dialog = getByRole('dialog');

    expect(dialog).not.toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-label', 'robin');
  });

  it('should have a hidden dismiss button for screen readers when displayed in a popover', function () {
    let onClose = jest.fn();
    let {getByRole} = render(
      <ModalProvider>
        <DialogContext.Provider value={{type: 'popover', onClose}}>
          <Dialog aria-label="robin">
            <Heading><Header>The Title</Header></Heading>
          </Dialog>
        </DialogContext.Provider>
      </ModalProvider>
    );

    let button = getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Dismiss');

    fireEvent.click(button);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have a hidden dismiss button for screen readers when displayed in a tray', function () {
    let onClose = jest.fn();
    let {getByRole} = render(
      <ModalProvider>
        <DialogContext.Provider value={{type: 'tray', onClose}}>
          <Dialog aria-label="robin">
            <Heading><Header>The Title</Header></Heading>
          </Dialog>
        </DialogContext.Provider>
      </ModalProvider>
    );

    let button = getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Dismiss');

    fireEvent.click(button);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should support custom data attributes', function () {
    let onClose = jest.fn();
    let {getByRole} = render(
      <ModalProvider>
        <DialogContext.Provider value={{type: 'tray', onClose}}>
          <Dialog data-testid="test">
            <Heading><Header>The Title</Header></Heading>
          </Dialog>
        </DialogContext.Provider>
      </ModalProvider>
    );

    let dialog = getByRole('dialog');
    expect(dialog).toHaveAttribute('data-testid', 'test');
  });
});
