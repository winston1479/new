sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"zzuru/orders/orderSummaryZ_ORD_SUMMARY/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("zzuru.orders.orderSummaryZ_ORD_SUMMARY.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			models.init(this);
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			models.loadData();
			this.getRouter().initialize();
		}
	});
});