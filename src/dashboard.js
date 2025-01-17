(function (enplug, document) {
    'use strict';

    /**
     * Controls the parent dashboard application. Exposes convenient UI controls to developers:
     *
     * - Page status: loading, error, 404.
     * - Loading indicator (with loading, success and error states)
     * - Confirm box with custom text
     * - Confirm unsaved changes box
     * - Change the page header title and buttons
     *
     * @class
     * @extends Sender
     */
    function DashboardSender() {

        // Call parent constructor with namespace
        enplug.classes.Sender.call(this, 'dashboard');

        /**
         * The buttons most recently registered with the dashboard header.
         * Stored locally so that we can respond to click events
         * @type {{ id:string, action:function, text:string, class:string }[]}
         */
        var currentButtons = [];

        /**
         * Keeps track of whether the dashboard is loading mode so clients can check.
         * @type {boolean}
         */
        var isLoading = true;

        /**
         * Sets the last part of the title bar breadcrumb.
         * Set an empty title '' to clear the title.
         *
         * The home/default page for an app should have no title set.
         *
         * @param {string} title
         * @param {function} [onSuccess]
         * @param {function} [onError]
         * @returns {number} callId
         */
        this.setHeaderTitle = function (title, onSuccess, onError) {
            this.validate(title, 'string', 'Header title must be a string.');
            return this.method({
                name: 'set.title',
                params: title,
                successCallback: onSuccess,
                errorCallback: onError,
            });
        };

        /**
         * Sets the primary action buttons for a page in the titlebar.
         *
         * Accepts either a single button object, or an array of buttons.
         * Each button must have a button.action callback.
         *
         * @param {{ text:string, class:string, action:function, disabled:boolean }[]} buttons
         * @param {function} [onSuccess]
         * @param {function} [onError]
         * @returns {number} callId
         */
        this.setHeaderButtons = function (buttons, onSuccess, onError) {
            this.validate(buttons, 'object', 'Header buttons must be an object (single) or array (multiple).');

            // Reset any buttons we may have stored
            currentButtons = [];

            // Allow single button or multiple
            buttons = Array.isArray(buttons) ? buttons : [buttons];

            for (var i = 0; i < buttons.length; i++) {
                var button = buttons[i];
                this.validate(button, 'object', 'Header buttons must be objects.');
                if (button) {
                    this.validate(button.action, 'function', 'Header buttons must have an action (function).');

                    // The button ID is used to identify which button was clicked in this service
                    button.id = 'button-' + (Math.round(Math.random() * (10000 - 1) + 1));
                    currentButtons[button.id] = button;
                }
            }

            return this.method({
                name: 'set.buttons',
                params: buttons,
                persistent: true,
                successCallback: function (clicked) {
                    if (clicked) {
                        var button = currentButtons[clicked.id];
                        if (button) {
                            button.action();
                        } else {
                            console.warn('Unrecognized button click:', clicked);
                        }
                    }

                    if (typeof onSuccess === 'function') {
                        onSuccess(clicked);
                    }
                },

                errorCallback: onError,
            });
        };

        /**
         * Controls the loading state for the entire page. Every application starts off in
         * loading state, and must set pageLoading(false) to notify the dashboard that it
         * has successfully loaded.
         *
         * Use .isLoading() to synchronously check current loading state.
         *
         * @param {boolean} bool
         * @param {function} [onSuccess]
         * @param {function} [onError]
         * @returns {number} callId
         */
        this.pageLoading = function (bool, onSuccess, onError) {
            this.validate(bool, 'boolean', 'Page loading status must be a boolean.');
            return this.method({
                name: 'page.loading',
                params: bool,
                successCallback: function () {
                    isLoading = bool;
                    if (typeof onSuccess === 'function') {
                        onSuccess(isLoading);
                    }
                },

                errorCallback: onError,
            });
        };

        /**
         * Synchronously returns the current loading state.
         *
         * Updated asynchronously when this sender receives an acknowledgement
         * of successful SDK call from the dashboard.
         *
         * @returns {boolean} - Current loading state
         */
        this.isLoading = function () {
            return isLoading;
        };

        /**
         * Puts the page into error state.
         *
         * @param {function} [onSuccess]
         * @param {function} [onError]
         * @returns {number} callId
         */
        this.pageError = function (onSuccess, onError) {
            return this.method({
                name: 'page.error',
                successCallback: onSuccess,
                errorCallback: onError,
            });
        };

        /**
         * Puts the page into 404 state.
         *
         * @param {function} [onSuccess]
         * @param {function} [onError]
         * @returns {number} callId
         */
        this.pageNotFound = function (onSuccess, onError) {
            return this.method({
                name: 'page.notFound',
                successCallback: onSuccess,
                errorCallback: onError,
            });
        };

        /**
         * Turns on the progress indicator, typically used during asynchronous actions.
         *
         * Note that the progress indicator will continue until a call is made to the
         * errorIndicator or successIndicator APIs.
         *
         * @param {string} message
         * @param {function} [onSuccess]
         * @param {function} [onError]
         * @returns {number} callId
         */
        this.loadingIndicator = function (message, onSuccess, onError) {
            this.validate(message, 'string', 'Loading indicator requires a loading message (string)');
            return this.method({
                name: 'indicator.loading',
                params: message,
                successCallback: onSuccess,
                errorCallback: onError,
            });
        };

        /**
         * Shows the success indicator.
         *
         * Should only be used after a call has been made to .loadingIndicator().
         *
         * @param {string} message
         * @param {function} [onSuccess]
         * @param {function} [onError]
         * @returns {number} callId
         */
        this.successIndicator = function (message, onSuccess, onError) {
            this.validate(message, 'string', 'Success indicator requires a success message (string)');
            return this.method({
                name: 'indicator.success',
                params: message,
                successCallback: onSuccess,
                errorCallback: onError,
            });
        };

        /**
         * Shows the error indicator.
         *
         * Should only be used after a call has been made to .loadingIndicator().
         *
         * @param {string} message
         * @param {function} [onSuccess]
         * @param {function} [onError]
         * @returns {number} callId
         */
        this.errorIndicator = function (message, onSuccess, onError) {
            this.validate(message, 'string', 'Error indicator requires an error message (string)');
            return this.method({
                name: 'indicator.error',
                params: message,
                successCallback: onSuccess,
                errorCallback: onError,
            });
        };

        /**
         * Opens a confirm window with Yes/No buttons and configurable messages.
         * If the user clicks the Confirm button, the success callback is called.
         * Otherwise the error callback is called.
         *
         * @param {Object} options
         * @param {string} options.title
         * @param {string} options.text
         * @param {string} [options.cancelText=Cancel]
         * @param {string} [options.confirmText=Confirm]
         * @param {string} [options.confirmClass=btn-primary]
         * @param {function} onSuccess
         * @param {function} [onError]
         * @returns {number} callId
         */
        this.openConfirm = function (options, onSuccess, onError) {
            this.validate(options, 'object', 'Confirm box requires options to be set (object).');

            if (options) {
                this.validate(options.title, 'string', 'Confirm box requires options.title to be set (string).');
                this.validate(options.text, 'string', 'Confirm box requires options.text to be set (string).');
            }

            return this.method({
                name: 'confirm',
                params: options,
                successCallback: onSuccess,
                errorCallback: onError,
            });
        };

        /**
         * Opens a confirm window asking the user to confirm their unsaved changes.
         *
         * If the user clicks the confirm button, the success callback is called.
         * Otherwise the error callback is called.
         *
         * @param {function} [onSuccess]
         * @param {function} [onError]
         * @returns {number} callId
         */
        this.confirmUnsavedChanges = function (onSuccess, onError) {
            return this.method({
                name: 'unsavedChanges',
                successCallback: onSuccess,
                errorCallback: onError,
            });
        };

        /**
         * Uses Filepicker upload interface and Enplug encoding service, returns uploaded object
         *
         * @param {Object} options - Filepicker options
         * @param {function} onSuccess
         * @param {function} onError
         * @returns {number} callId
         */
        this.upload = function (options, onSuccess, onError) {
            return this.method({
                name: 'upload',
                params: options,
                successCallback: onSuccess,
                errorCallback: onError,
            });
        };

        /**
         * Removes event listeners to prevent memory leaks.
         */
        this.cleanup = function () {
            document.removeEventListener('click', listenToClicks, false);
            enplug.classes.Sender.prototype.cleanup.call(this);
        };

        /**
         * Notifies the parent dashboard of a click in the child iFrame. Used to close
         * dropdown windows etc which were opened in parent window and are unable to
         * respond to click events in child iFrame.
         *
         * Event handler is automatically bound when a DashboardSender is created.
         *
         * @returns {string} callId
         */
        this.click = function () {
            return this.method({
                name: 'click',
                transient: true, // don't wait for a response
            });
        };

        // Broadcast clicks up to parent window so that we can
        // react to clicks for things like closing nav dropdowns
        var _this = this;
        function listenToClicks() {
            _this.click();
            return true;
        }

        document.addEventListener('click', listenToClicks, false);
    }

    // Inherit
    DashboardSender.prototype = Object.create(enplug.classes.Sender.prototype);

    // Export
    enplug.classes.DashboardSender = DashboardSender;
    enplug.dashboard = new DashboardSender();
}(window.enplug, document));
