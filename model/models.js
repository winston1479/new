sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/ui/model/odata/ODataModel"
], function (JSONModel, Device, ODataModel) {
	"use strict";

	return {
		init: function (oComponent) {

			// Set component object as global. 			
			this.oComponent = oComponent;

			// Set up deferred object
			this.stockSheetDeferred = jQuery.Deferred();

			// set the device model
			this.oComponent.setModel(this.createDeviceModel(), "device");

			// Create JSON model
			this.oComponent.setModel(this.createServiceExceptionJSONModel(), "orderSummaryJson");

			// Create oData model
			// Set default service for entire app (leave last argument blank)			
			this.oComponent.setModel(this.createServiceExceptionModel());
			sap.ui.getCore().setModel(this.createServiceExceptionModel());

		},

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneTime");
			return oModel;
		},

		createServiceExceptionModel: function () {
			try {

				// Define where our Odata service is
				var sServiceUrl = "/sap/opu/odata/sap/ZORDER_SUMMARY_SRV/";
				var oModel = new ODataModel(sServiceUrl, {
					json: true,
					loadMetadataAsync: true,
					skipMetadataAnnotationParsing: true,
					sequentializeRequests: true

				});
				oModel.setDefaultCountMode("None");
				//oModel.attachMetadataFailed(this.onMetadataRequestFailed, this);

				// Set up error handle
				oModel.attachRequestFailed(this.onRequestFailed, this);

				// Set up handler for metadata loaded
				oModel.attachMetadataLoaded(this.exceptionModelMetadataLoaded, this);

				return oModel;
			} catch (e) {
				window.console.log(e.message);
				alert(e.message);
			}
		},

		// Handle errors from Odata service request
		onRequestFailed: function () {
			//	alert("error");
		},

		// Once meta data has loaded, read data from oData service        
		exceptionModelMetadataLoaded: function (oResponse) {

			this.stockSheetDeferred.resolve();

		},

		// Create our JSON model to hold data from oData service        
		createServiceExceptionJSONModel: function () {
			var oModel = new JSONModel();
			return oModel;
		},

		loadData: function () {
			jQuery.when(this.stockSheetDeferred).then(jQuery.proxy(this.loadModelData, this));

		},

		loadModelData: function () {

			//		this.loadSalesExceptionJSON();

		}

	};

});