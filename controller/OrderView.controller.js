sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/model/Filter",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",

], function (Controller, ODataModel, Filter, Export, ExportTypeCSV) {
	"use strict";
	jQuery.sap.require("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.oDataOperations");
	jQuery.sap.require("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.formatter");
	jQuery.sap.require("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.underscore");

	// jQuery.sap.require("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.LoadingIcon");
	// jQuery.sap.require("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.html2Canvas");
	var oControl = null;
	return Controller.extend("zzuru.orders.orderSummaryZ_ORD_SUMMARY.controller.OrderView", {
		_saleOrderNo: null,
		iconView: false,
		_oView: null,

		onInit: function () {
			if (sap.ui.Device.system.phone === false && sap.ui.Device.system.tablet === false) {
				this.getView().byId("outboundSplitAppId2-MasterBtn").setVisible(false);
			}
			oControl = this.getView().getController();
			this.oDataOperations = new zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.oDataOperations();
			this._oView = this.getView().getId();
			this._oView = this.getView();
			this._oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));
			this._oModel = this._oComponent.getModel();
			// if (sap.ui.Device.system.tablet == true || sap.ui.Device.system.phone == true) {
			this.getOwnerComponent().getRouter().getRoute("OrderView").attachPatternMatched(this, jQuery.proxy(this.routePatternMatched, this));
			//	}
			this.resourcePath = jQuery.sap.getResourcePath("zzuru/orders/orderSummaryZ_ORD_SUMMARY");
			if (!this.busyDialog) {
				this.busyDialog = sap.ui.xmlfragment("zzuru.orders.orderSummaryZ_ORD_SUMMARY.fragments.OrderViewBusyDlg", this);
				this.getView().addDependent(this.busyDialog);
			}
			sap.ui.getCore().byId("orderViewBusyDialog").open();

		},
		onAfterRendering: function () {
			this.getSplitAppObj().to(this.createId("fourthView"));
			var viewId = this.getView().getId();
			if (sap.ui.Device.system.phone == false) {
				$("#" + viewId + "--printBtnHeader").css("display", "none");

			}
			if (sap.ui.Device.system.phone === true || sap.ui.Device.system.tablet === true) {
				$("#" + viewId + "--navBack").css("display", "unset");
			} else {
				$("#" + viewId + "--navBack").css("display", "none");
			}
			if (sap.ui.Device.system.phone) {
				$("#" + viewId + "--orderInfoheader").css("display", "none");
				$("#" + viewId + "--footerBar").css("display", "none");
			}
			setTimeout(function () {
				sap.ui.getCore().byId("orderViewBusyDialog").close();
				// if (sap.ui.Device.system.phone) {

				// }
			}, 1000);
			// if (sap.ui.Device.system.desktop === true) {
			// 	this.getOwnerComponent().getRouter().getRoute("OrderView").attachPatternMatched(this, jQuery.proxy(this.routePatternMatched, this));
			// }
			if (sap.ui.Device.system.tablet === true) {
				//	sap.ui.getCore().byId("__xmlview1--outboundSplitAppId-Master").setVisible(false);
				// $("#__xmlview1--outboundSplitAppId2-Master").css("display", "none");
				this.getView().byId("outboundSplitAppId2-Master").setVisible(false);
			}
			if (sap.ui.Device.system.tablet === true) {
				this.getView().byId("outboundSplitAppId2-MasterBtn").setVisible(false);
			}
			// setTimeout(function () {
			// 	if (sap.ui.Device.system.phone) {
			// 		// this.checkOrientation();

			// 		oControl.orientationCheck();
			// 	}
			// }, 100);
			// sap.ui.Device.orientation.attachHandler(function (oEvt) {
			// 	oControl.orientationCheck();
			// 	setTimeout(function () {

			// 		oControl.setDynamicOrderViewTableRowCount();
			// 	}, 100);
			// });
			var orderInfoHeader = this.getView().byId("orderInfoheader");
			//	var scope = this;
			var tblId = this.getView().byId("ordersSectionTable");
			if (sap.ui.Device.system.phone) {
				for (var i in tblId.getColumns()) {
					var colId = tblId.getColumns()[i].getId();
					sap.ui.getCore().byId(colId).setFilterProperty(null);
					sap.ui.getCore().byId(colId).setSortProperty(null);
					sap.ui.getCore().byId(colId).setResizable(false);
				}
			}

		},
		getSplitAppObj: function () {
			var result = this.byId("outboundSplitAppId2");
			if (!result) {
				alert("SplitApp object can't be found");
			}
			return result;
		},
		// orientationCheck: function () {
		// 	if ((sap.ui.Device.system.phone || sap.ui.Device.system.tablet) && sap.ui.Device.orientation.portrait) {
		// 		this.getView().byId("parentPanel").setVisible(false);
		// 		this.getView().byId("hidePortraitView").setVisible(true);
		// 		this.getView().byId("thirdView").setShowFooter(false);
		// 	} else {
		// 		this.getView().byId("parentPanel").setVisible(true);
		// 		this.getView().byId("hidePortraitView").setVisible(false);
		// 		this.getView().byId("thirdView").setShowFooter(true);
		// 	}
		// },
		iconAction: function () {
			var viewId = this.getView().getId();
			if (this.iconView) {
				this.iconView = false;
				$("#" + viewId + "--orderInfoheader").css("display", "none");
				this.getView().byId("expandIcon").setIcon("sap-icon://navigation-right-arrow");
			} else {
				this.iconView = true;
				$("#" + viewId + "--orderInfoheader").css("display", "inline-block");
				this.getView().byId("expandIcon").setIcon("sap-icon://navigation-down-arrow");
			}
			this.setDynamicOrderViewTableRowCount();
		},
		setDynamicOrderViewTableRowCount: function () {
			var scope = this;
			setTimeout(function () {
				var viewId = scope.getView().getId();
				var orderInfoheader;
				if (sap.ui.Device.system.phone === true) {
					scope.getView().byId("ordersSectionTable").setFixedColumnCount(1);
				} else {
					scope.getView().byId("ordersSectionTable").setFixedColumnCount(1);
				}
				var windowHeight = window.innerHeight;
				var hght;
				console.log(windowHeight, "windowHeight");
				var pageHeaderHeight = $("#" + viewId + "--fourthView-intHeader").height();
				console.log(pageHeaderHeight, "pageHeaderHeight");
				var headerInfo = $("#__header0").height();
				console.log(headerInfo, "headerInfo");
				if (scope.iconView !== false && sap.ui.Device.system.phone) {
					orderInfoheader = $("#" + viewId + "--orderInfoheader").height();
					console.log(orderInfoheader, "orderInfoheader")
				} else if (!sap.ui.Device.system.phone) {
					orderInfoheader = $("#" + viewId + "--orderInfoheader").height();
				} else {
					orderInfoheader = 0;
				}
				if (sap.ui.Device.system.phone || sap.ui.Device.system.tablet) {
					hght = $(".sapUiTableHSb").height();
				} else {
					hght = 0;
				}
				var tabelHeaderHeight = $(".sapUiTableColHdrCnt").height();
				console.log(tabelHeaderHeight, "tabelHeaderHeight")
				var footerHeight = $("#" + viewId + "--footerBar").height();
				console.log(footerHeight, "footerHeight")
				var tableCenterHeight = windowHeight - pageHeaderHeight - headerInfo - orderInfoheader - tabelHeaderHeight - footerHeight - hght;
				console.log(tableCenterHeight, "tableCenterHeight")
					//var tableCustomHeight = (tableCenterHeight + 25);
				var tableRowHeight = $("#" + viewId + "--ordersSectionTable-rows-row0-col0").height();
				console.log(tableRowHeight, "tableRowHeight")
					//var rowCount = sap.ui.getCore().byId("__xmlview1--ordersSectionTable").getModel().getData().sEntity.length;

				var customRowCount = Math.floor(tableCenterHeight / tableRowHeight);
				console.log(customRowCount, "customRowCount")
					// var setRowCount;
					// if (customRowCount < rowCount) {
					// 	setRowCount = customRowCount;
					// } else if (customRowCount > rowCount) {
					// 	setRowCount = rowCount;
					// }
				if (customRowCount === 1 || customRowCount === 0) {
					scope.getView().byId("ordersSectionTable").setVisibleRowCount(1);
				} else {
					scope.getView().byId("ordersSectionTable").setVisibleRowCount(customRowCount - 1);
				}
				scope.getView().byId("ordersSectionTable").rerender();
				// $("#__xmlview1--ordersSectionTable-tableCCnt").attr("style", "min-height: "+tableCustomHeight+"px;");

			}, 500);
		},

		routePatternMatched: function (oEvent) {
			var salesOrderNo = oEvent.getParameters().arguments.salesOrderNumber;
			this._saleOrderNo = salesOrderNo;
			if (this._oModel.getServiceMetadata() !== undefined) {

				this.loadOrderViewTableValues(salesOrderNo);
				this.loadOrderViewHeader(salesOrderNo);
				this.loadOrderViewTopHeader();
			} else {
				this._oModel.attachMetadataLoaded(this, jQuery.proxy(this.onMetadataLoad, this));
			}
		},
		goback: function () {
			this.getOwnerComponent().getRouter().navTo("TableView");
		},
		onMetadataLoad: function () {
			var saleOrderNumber = this.getOwnerComponent().getRouter()._oRouter._prevMatchedRequest.split("/");
			saleOrderNumber = saleOrderNumber[1];
			this._saleOrderNo = saleOrderNumber;
			this.loadOrderViewTableValues(saleOrderNumber);
			this.loadOrderViewHeader(saleOrderNumber);
			this.loadOrderViewTopHeader();
		},
		loadOrderViewTopHeader: function () {
			var orderInfoHeader = this.getView().byId("orderInfoheader");
			var orderInfoHeaderVal = orderInfoHeader.getModel().getData().HeaderSet;
			// var viewId = sap.ui.getCore().byId("__xmlview1");
			this.getView().byId("salesOrderNo").setText(orderInfoHeaderVal.Vbeln);
			this.getView().byId("status").setText(orderInfoHeaderVal.OrderStatus);
			var poCreatedDate = this.formatDateValue(orderInfoHeaderVal.Aedat);
			this.getView().byId("createdDate").setText("  " + poCreatedDate);
			// orderInfoHeader.addEventDelegate({
			// 	onAfterRendering: function () {
			// 		sap.ui.getCore().byId("__xmlview1--salesOrderNo").setText(orderInfoHeaderVal.Vbeln);
			// 		sap.ui.getCore().byId("__xmlview1--status").setText(orderInfoHeaderVal.OrderStatus);
			// 		var poCreatedDate = this.formatDateValue(orderInfoHeaderVal.Aedat);
			// 		sap.ui.getCore().byId("__xmlview1--createdDate").setText(poCreatedDate);
			// 	}
			// });

			// setTimeout(function () {
			// 	$.loader.close();
			// }, 20);

		},
		loadOrderViewTableValues: function (salesOrderNo) {
			var orderSectionTable = this.getView().byId("ordersSectionTable");
			var aFilters = [];

			var salesOrderNum = new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, salesOrderNo);
			aFilters.push(salesOrderNum);

			this.oDataOperations.readOperation("/SODetailSet", aFilters, orderSectionTable, this._oModel, "", "", "", "", "", "", "",
				false, "Table", "SODetailSet");
			var tabelDataValue = this.getView().byId("ordersSectionTable").getModel().getData();
			for (var l = 0; l < tabelDataValue.SODetailSet.length; l++) {
				tabelDataValue.SODetailSet[l].lineItemNumber = l + 1;
			}
			this.setDynamicOrderViewTableRowCount();
		},
		loadOrderViewHeader: function (salesOrderNo) {
			var viewId = this.getView().getId();
			var orderInfoHeader = this.getView().byId("orderInfoheader");
			// var aFilters = [];

			// var salesOrderNum = new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, salesOrderNo);
			// aFilters.push(salesOrderNum);
			var isLayout = "X";
			this.oDataOperations.readOperation("/HeaderSet", "", orderInfoHeader, this._oModel, "", "", "", "", salesOrderNo, isLayout, "",
				false, "", "HeaderSet");
			$("#" + viewId + "--volume").append('<sup>3</sup>');

		},
		onPrint: function () {
			// this._saleOrderNo = "Vbeln=" + this._saleOrderNo;
			// this.oDataOperations.readOperation("/OrderViewPdf", "", "pdf", this._oModel, "", "", "", "", this._saleOrderNo);
			var that = this;
			var oModel = sap.ui.getCore().getModel();
			window.open("/sap/opu/odata/sap/ZORDER_SUMMARY_SRV/OrderViewPdf(Vbeln=" + "'" + this._saleOrderNo + "'" + ")/$value",
				"So detail");
		},
		hintIconPress: function (oEvent) {
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("zzuru.orders.orderSummaryZ_ORD_SUMMARY.fragments.hintSection", this);
				// this._oPopover.bindElement("/ProductCollection/0");
				this.getView().addDependent(this._oPopover);
			}

			this._oPopover.openBy(oEvent.getSource());
			var orderSectionTable = this.getView().byId("ordersSectionTable").getModel().getData();
			if (oEvent.getSource().data("supplier") !== "") {
				sap.ui.getCore().byId("supplier").setText(oEvent.getSource().data("supplier"));
			} else {
				sap.ui.getCore().byId("supplier").setText(" - ");
			}
			if (oEvent.getSource().data("packType") !== "") {
				sap.ui.getCore().byId("packType").setText(oEvent.getSource().data("packType"));
			} else {
				sap.ui.getCore().byId("packType").setText(" - ");
			}
		},

		formatDateValue: function (oDate) {
			if (oDate) {
				if (typeof oDate === "string") {
					if (oDate.indexOf("/") == -1) {
						return oDate;
					}
					oDate = eval(("new " + oDate).replace(/\//g, ""));
				} else {
					oDate = (oDate instanceof Date) ? oDate : new Date(oDate);
				}
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					source: {
						pattern: "timestamp"
					},
					pattern: "yyyy.MM.dd"
				});
				return dateFormat.format(oDate);
			} else {
				return "-";
			}
		},

	});

});