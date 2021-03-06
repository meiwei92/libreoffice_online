/* global describe it cy beforeEach require afterEach */

var helper = require('../../common/helper');
var calcHelper = require('../../common/calc_helper');
var mobileHelper = require('../../common/mobile_helper');
var calcMobileHelper = require('./calc_mobile_helper');

describe('Apply number formatting.', function() {
	var testFileName = 'number_format.ods';

	beforeEach(function() {
		helper.beforeAll(testFileName, 'calc');

		// Click on edit button
		mobileHelper.enableEditingMobile();

		calcHelper.clickOnFirstCell();

		cy.get('.leaflet-marker-icon')
			.should('be.visible');

		mobileHelper.openMobileWizard();

		helper.clickOnIdle('#ScNumberFormatPropertyPanel');

		cy.get('#numberformatcombobox')
			.should('be.visible');
	});

	afterEach(function() {
		helper.afterAll(testFileName);
	});

	function selectFormatting(formattingString) {
		// Select formatting list
		helper.clickOnIdle('#numberformatcombobox');

		helper.clickOnIdle('.mobile-wizard.ui-combobox-text', formattingString);

		// Combobox entry contains the selected format
		cy.get('#numberformatcombobox .ui-header-left')
			.should('have.text', formattingString);
	}

	it('Select percent format from list.', function() {
		selectFormatting('Percent');

		cy.get('#NumberFormatPercentimg')
			.should('have.class', 'selected');

		// Decimal and leading zeros are changed.
		cy.get('#decimalplaces input')
			.should('have.attr', 'value', '2');

		cy.get('#leadingzeroes input')
			.should('have.attr', 'value', '1');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;0.00%');

		cy.get('#copy-paste-container table td')
			.should('have.text', '100000.00%');
	});

	it('Push percent button.', function() {
		helper.clickOnIdle('#NumberFormatPercent');

		cy.get('#NumberFormatPercentimg')
			.should('have.class', 'selected');

		cy.get('#numberformatcombobox .ui-header-left')
			.should('have.text', 'Percent');

		// Decimal and leading zeros are changed.
		cy.get('#decimalplaces input')
			.should('have.attr', 'value', '2');

		cy.get('#leadingzeroes input')
			.should('have.attr', 'value', '1');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;0.00%');

		cy.get('#copy-paste-container table td')
			.should('have.text', '100000.00%');
	});

	it('Select currency format from list.', function() {
		selectFormatting('Currency');

		cy.get('#NumberFormatCurrencyimg')
			.should('have.class', 'selected');

		// Decimal and leading zeros are changed.
		cy.get('#decimalplaces input')
			.should('have.attr', 'value', '2');

		cy.get('#leadingzeroes input')
			.should('have.attr', 'value', '1');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;[$$-409]#,##0.00;[RED]-[$$-409]#,##0.00');

		cy.get('#copy-paste-container table td')
			.should('have.text', '$1,000.00');
	});

	it('Push currency button.', function() {
		helper.clickOnIdle('#NumberFormatCurrency');

		cy.get('#NumberFormatCurrencyimg')
			.should('have.class', 'selected');

		cy.get('#numberformatcombobox .ui-header-left')
			.should('have.text', 'Currency');

		// Decimal and leading zeros are changed.
		cy.get('#decimalplaces input')
			.should('have.attr', 'value', '2');

		cy.get('#leadingzeroes input')
			.should('have.attr', 'value', '1');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;[$$-409]#,##0.00;[RED]-[$$-409]#,##0.00');

		cy.get('#copy-paste-container table td')
			.should('have.text', '$1,000.00');
	});

	it('Push number button.', function() {
		// Change to currency first
		helper.clickOnIdle('#NumberFormatCurrency');

		cy.get('#NumberFormatCurrencyimg')
			.should('have.class', 'selected');

		// Decimal and leading zeros are changed.
		cy.get('#decimalplaces input')
			.should('have.attr', 'value', '2');

		cy.get('#leadingzeroes input')
			.should('have.attr', 'value', '1');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;[$$-409]#,##0.00;[RED]-[$$-409]#,##0.00');

		cy.get('#copy-paste-container table td')
			.should('have.text', '$1,000.00');

		calcHelper.clickOnFirstCell();

		mobileHelper.openMobileWizard();

		helper.clickOnIdle('#ScNumberFormatPropertyPanel');

		cy.get('#NumberFormatDecimal')
			.should('be.visible');

		// Change to number formatting
		helper.clickOnIdle('#NumberFormatDecimal');

		cy.get('#NumberFormatDecimalimg')
			.should('have.class', 'selected');

		cy.get('#numberformatcombobox .ui-header-left')
			.should('have.text', 'Number');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.text', '1,000.00');
	});

	it('Select date format from list.', function() {
		helper.clickOnIdle('#numberformatcombobox');

		helper.clickOnIdle('.mobile-wizard.ui-combobox-text', 'Date');

		// Combobox entry contains the selected format
		cy.get('#numberformatcombobox .ui-header-left')
			.should('have.text', 'Date ');

		// Decimal and leading zeros are changed.
		cy.get('#decimalplaces input')
			.should('have.attr', 'value', '0');

		cy.get('#leadingzeroes input')
			.should('have.attr', 'value', '0');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;MM/DD/YY');

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdval', '1000');

		cy.get('#copy-paste-container table td')
			.should('have.text', '09/26/02');
	});

	it('Select time format from list.', function() {
		selectFormatting('Time');

		// Decimal and leading zeros are changed.
		cy.get('#decimalplaces input')
			.should('have.attr', 'value', '0');

		cy.get('#leadingzeroes input')
			.should('have.attr', 'value', '0');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;HH:MM:SS AM/PM');

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdval', '1000');

		cy.get('#copy-paste-container table td')
			.should('have.text', '12:00:00 AM');
	});

	it('Select scientific format from list.', function() {
		selectFormatting('Scientific');

		// Decimal and leading zeros are changed.
		cy.get('#decimalplaces input')
			.should('have.attr', 'value', '2');

		cy.get('#leadingzeroes input')
			.should('have.attr', 'value', '1');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;0.00E+00');

		cy.get('#copy-paste-container table td')
			.should('have.text', '1.00E+03');
	});

	it('Select fraction format from list.', function() {
		selectFormatting('Fraction');

		// Decimal and leading zeros are changed.
		cy.get('#decimalplaces input')
			.should('have.attr', 'value', '1');

		cy.get('#leadingzeroes input')
			.should('have.attr', 'value', '0');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;# ?/?');

		cy.get('#copy-paste-container table td')
			.should('have.text', '1000    ');
	});

	it('Select boolean format from list.', function() {
		selectFormatting('Boolean Value');

		// Decimal and leading zeros are changed.
		cy.get('#decimalplaces input')
			.should('have.attr', 'value', '0');

		cy.get('#leadingzeroes input')
			.should('have.attr', 'value', '0');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;BOOLEAN');

		cy.get('#copy-paste-container table td')
			.should('have.text', 'TRUE');
	});

	it('Select text format from list.', function() {
		selectFormatting('Text');

		// Decimal and leading zeros are changed.
		cy.get('#decimalplaces input')
			.should('have.attr', 'value', '0');

		cy.get('#leadingzeroes input')
			.should('have.attr', 'value', '0');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;@');

		cy.get('#copy-paste-container table td')
			.should('have.text', '1000');
	});

	it('Change decimal places.', function() {
		// Check default value
		cy.get('#decimalplaces input')
			.should('have.attr', 'value', '0');

		// Type in a new value
		cy.get('#decimalplaces input')
			.clear()
			.type('2{enter}');

		cy.get('#decimalplaces input')
			.should('have.attr', 'value', '2');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;0.00');

		cy.get('#copy-paste-container table td')
			.should('have.text', '1000.00');
	});

	it('Change leading zeros.', function() {
		// Check default value
		cy.get('#leadingzeroes input')
			.should('have.attr', 'value', '1');

		// Type in a new value
		cy.get('#leadingzeroes input')
			.clear()
			.type('6{enter}');

		cy.get('#leadingzeroes input')
			.should('have.attr', 'value', '6');

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;000000');

		cy.get('#copy-paste-container table td')
			.should('have.text', '001000');
	});

	it('Apply red color for negative numbers.', function() {
		// Check default value
		cy.get('#negativenumbersred input')
			.should('not.have.prop', 'checked', true);

		// Change the option
		helper.clickOnIdle('#negativenumbersred input');

		cy.get('#negativenumbersred input')
			.should('have.prop', 'checked', true);

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;0;[RED]-0');

		cy.get('#copy-paste-container table td')
			.should('have.text', '1000');
	});

	it('Add thousands separator.', function() {
		// Check default value
		cy.get('#thousandseparator input')
			.should('not.have.prop', 'checked', true);

		// Change the option
		helper.clickOnIdle('#thousandseparator input');

		cy.get('#thousandseparator input')
			.should('have.prop', 'checked', true);

		calcMobileHelper.selectAllMobile();

		cy.get('#copy-paste-container table td')
			.should('have.attr', 'sdnum', '1033;0;#,##0');

		cy.get('#copy-paste-container table td')
			.should('have.text', '1,000');
	});
});
