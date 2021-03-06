(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Geosuggest = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global google */

'use strict';

var React = require('react'),
    GeosuggestItem = require('./GeosuggestItem'); // eslint-disable-line

var noop = function noop() {};

var Geosuggest = React.createClass({
  displayName: 'Geosuggest',

  /**
   * Get the default props
   * @return {Object} The state
   */
  getDefaultProps: function getDefaultProps() {
    return {
      fixtures: [],
      initialValue: '',
      placeholder: 'Search places',
      className: '',
      onSuggestSelect: function onSuggestSelect() {},
      location: null,
      radius: 0,
      bounds: null,
      country: null,
      types: null,
      googleMaps: google && google.maps,
      onFocus: noop,
      onBlur: noop,
      onChange: noop
    };
  },

  /**
   * Get the initial state
   * @return {Object} The state
   */
  getInitialState: function getInitialState() {
    return {
      isSuggestsHidden: true,
      userInput: this.props.initialValue,
      activeSuggest: null,
      suggests: [],
      geocoder: new this.props.googleMaps.Geocoder(),
      autocompleteService: new this.props.googleMaps.places.AutocompleteService()
    };
  },

  /**
   * When the input got changed
   */
  onInputChange: function onInputChange() {
    var userInput = this.refs.geosuggestInput.getDOMNode().value;

    this.setState({ userInput: userInput }, (function () {
      this.showSuggests();
      this.props.onChange(userInput);
    }).bind(this));
  },

  /**
   * When the input gets focused
   */
  onFocus: function onFocus() {
    this.props.onFocus();
    this.showSuggests();
  },

  /**
   * Update the value of the user input
   * @param {String} value the new value of the user input
   */
  update: function update(value) {
    this.setState({ userInput: value });
    this.props.onChange(value);
  },

  /*
   * Clear the input and close the suggestion pane
   */
  clear: function clear() {
    this.setState({ userInput: '' }, (function () {
      this.hideSuggests();
    }).bind(this));
  },

  /**
   * Search for new suggests
   */
  searchSuggests: function searchSuggests() {
    if (!this.state.userInput) {
      this.updateSuggests();
      return;
    }

    var options = {
      input: this.state.userInput,
      location: this.props.location || new this.props.googleMaps.LatLng(0, 0),
      radius: this.props.radius
    };

    if (this.props.bounds) {
      options.bounds = this.props.bounds;
    }

    if (this.props.types) {
      options.types = this.props.types;
    }

    if (this.props.country) {
      options.componentRestrictions = {
        country: this.props.country
      };
    }

    this.state.autocompleteService.getPlacePredictions(options, (function (suggestsGoogle) {
      this.updateSuggests(suggestsGoogle);
    }).bind(this));
  },

  /**
   * Update the suggests
   * @param  {Object} suggestsGoogle The new google suggests
   */
  updateSuggests: function updateSuggests(suggestsGoogle) {
    if (!suggestsGoogle) {
      suggestsGoogle = [];
    }

    var suggests = [],
        regex = new RegExp(this.state.userInput, 'gim');

    this.props.fixtures.forEach(function (suggest) {
      if (suggest.label.match(regex)) {
        suggest.placeId = suggest.label;
        suggests.push(suggest);
      }
    });

    suggestsGoogle.forEach(function (suggest) {
      suggests.push({
        label: suggest.description,
        placeId: suggest.place_id
      });
    });

    this.setState({ suggests: suggests });
  },

  /**
   * When the input gets focused
   */
  showSuggests: function showSuggests() {
    this.searchSuggests();
    this.setState({ isSuggestsHidden: false });
  },

  /**
   * When the input loses focused
   */
  hideSuggests: function hideSuggests() {
    this.props.onBlur();
    setTimeout((function () {
      this.setState({ isSuggestsHidden: true });
    }).bind(this), 100);
  },

  /**
   * When a key gets pressed in the input
   * @param  {Event} event The keypress event
   */
  onInputKeyDown: function onInputKeyDown(event) {
    switch (event.which) {
      case 40:
        // DOWN
        event.preventDefault();
        this.activateSuggest('next');
        break;
      case 38:
        // UP
        event.preventDefault();
        this.activateSuggest('prev');
        break;
      case 13:
        // ENTER
        this.selectSuggest(this.state.activeSuggest);
        break;
      case 9:
        // TAB
        this.selectSuggest(this.state.activeSuggest);
        break;
      case 27:
        // ESC
        this.hideSuggests();
        break;
      default:
        break;
    }
  },

  /**
   * Activate a new suggest
   * @param {String} direction The direction in which to activate new suggest
   */
  activateSuggest: function activateSuggest(direction) {
    if (this.state.isSuggestsHidden) {
      this.showSuggests();
      return;
    }

    var suggestsCount = this.state.suggests.length - 1,
        next = direction === 'next',
        newActiveSuggest = null,
        newIndex = 0,
        i = 0;

    for (i; i <= suggestsCount; i++) {
      if (this.state.suggests[i] === this.state.activeSuggest) {
        newIndex = next ? i + 1 : i - 1;
      }
    }

    if (!this.state.activeSuggest) {
      newIndex = next ? 0 : suggestsCount;
    }

    if (newIndex >= 0 && newIndex <= suggestsCount) {
      newActiveSuggest = this.state.suggests[newIndex];
    }

    this.setState({ activeSuggest: newActiveSuggest });
  },

  /**
   * When an item got selected
   * @param {GeosuggestItem} suggest The selected suggest item
   */
  selectSuggest: function selectSuggest(suggest) {
    if (!suggest) {
      suggest = {
        label: this.state.userInput
      };
    }

    this.setState({
      isSuggestsHidden: true,
      userInput: suggest.label
    });

    if (suggest.location) {
      this.props.onSuggestSelect(suggest);
      return;
    }

    this.geocodeSuggest(suggest);
  },

  /**
   * Geocode a suggest
   * @param  {Object} suggest The suggest
   */
  geocodeSuggest: function geocodeSuggest(suggest) {
    this.state.geocoder.geocode({ address: suggest.label }, (function (results, status) {
      if (status !== this.props.googleMaps.GeocoderStatus.OK) {
        return;
      }

      var gmaps = results[0],
          location = gmaps.geometry.location;

      suggest.gmaps = gmaps;
      suggest.location = {
        lat: location.lat(),
        lng: location.lng()
      };

      this.props.onSuggestSelect(suggest);
    }).bind(this));
  },

  /**
   * Render the view
   * @return {Function} The React element to render
   */
  render: function render() {
    return ( // eslint-disable-line no-extra-parens
      React.createElement(
        'div',
        { className: 'geosuggest ' + this.props.className,
          onClick: this.onClick },
        React.createElement('input', {
          className: 'geosuggest__input',
          ref: 'geosuggestInput',
          type: 'text',
          value: this.state.userInput,
          placeholder: this.props.placeholder,
          onKeyDown: this.onInputKeyDown,
          onChange: this.onInputChange,
          onFocus: this.onFocus,
          onBlur: this.hideSuggests }),
        React.createElement(
          'ul',
          { className: this.getSuggestsClasses() },
          this.getSuggestItems()
        )
      )
    );
  },

  /**
   * Get the suggest items for the list
   * @return {Array} The suggestions
   */
  getSuggestItems: function getSuggestItems() {
    return this.state.suggests.map((function (suggest) {
      var isActive = this.state.activeSuggest && suggest.placeId === this.state.activeSuggest.placeId;

      return ( // eslint-disable-line no-extra-parens
        React.createElement(GeosuggestItem, {
          key: suggest.placeId,
          suggest: suggest,
          isActive: isActive,
          onSuggestSelect: this.selectSuggest })
      );
    }).bind(this));
  },

  /**
   * The classes for the suggests list
   * @return {String} The classes
   */
  getSuggestsClasses: function getSuggestsClasses() {
    var classes = 'geosuggest__suggests';

    classes += this.state.isSuggestsHidden ? ' geosuggest__suggests--hidden' : '';

    return classes;
  }
});

module.exports = Geosuggest;

},{"./GeosuggestItem":2,"react":undefined}],2:[function(require,module,exports){
'use strict';

var React = require('react');

var GeosuggestItem = React.createClass({
  displayName: 'GeosuggestItem',

  /**
   * Get the default props
   * @return {Object} The props
   */
  getDefaultProps: function getDefaultProps() {
    return {
      isActive: false,
      suggest: {
        label: ''
      },
      onSuggestSelect: function onSuggestSelect() {}
    };
  },

  /**
   * When the element gets clicked
   * @param  {Event} event The click event
   */
  onClick: function onClick(event) {
    event.preventDefault();
    this.props.onSuggestSelect(this.props.suggest);
  },

  /**
   * Render the view
   * @return {Function} The React element to render
   */
  render: function render() {
    return ( // eslint-disable-line no-extra-parens
      React.createElement(
        'li',
        { className: this.getSuggestClasses(),
          onClick: this.onClick },
        this.props.suggest.label
      )
    );
  },

  /**
   * The classes for the suggest item
   * @return {String} The classes
   */
  getSuggestClasses: function getSuggestClasses() {
    var classes = 'geosuggest-item';

    classes += this.props.isActive ? ' geosuggest-item--active' : '';

    var className = this.props.suggest.className;
    classes += className ? ' ' + className : '';

    return classes;
  }
});

module.exports = GeosuggestItem;

},{"react":undefined}]},{},[1])(1)
});