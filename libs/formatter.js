jQuery.sap.declare("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.formatter");
formatter = {
	showOrHideItem: function (salesPersonName, salesPersonId) {
		if (salesPersonName || salesPersonId) {
			return true;
		} else {
			return false;
		}
	},
	showSalesPersonvalue: function (salesPersonName, salesPersonId) {
		if (salesPersonName && !salesPersonId) {
			return salesPersonName;
		} else if (!salesPersonName && salesPersonId) {
			return salesPersonId;
		} else if (!salesPersonName && !salesPersonId) {
			return "";
		} else if (salesPersonName && salesPersonId) {
			return salesPersonName + " - " + salesPersonId;
		}

	},
	formatOrderTyperValue: function (val1, val2) {
		return val1 + " - " + val2;
	},
	formatCustomerValue: function (name, Id) {
		return name + " " + " - " + Id;
	},
	showStatusImage: function (value, so) {
		if (so) {
			if (value === "OPEN") {
				return "/sap/bc/ui5_ui5/sap/z_ord_summary/images/truck_process.svg";
			} else if (value === "DELIVERED") {
				return "/sap/bc/ui5_ui5/sap/z_ord_summary/images/truck_delivered.svg";
			} else if (value === "CANCELLED") {
				return "/sap/bc/ui5_ui5/sap/z_ord_summary/images/cancelledorders.svg";
			}
		} else {
			return "";
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
	formatQuantityvalue: function (val, so) {
		if (so) {
			if (val) {
				return parseFloat(val).toFixed(0);
			} else {

				return "-";
			}
		} else {
			return "";

		}

	},
	showorHideCtrl: function () {
		console.log("intoformatter");
		if (sap.ui.Device.system.phone === true) {

			return false;
		} else {
			return true;
		}
	},
	showOrHideNavBtn: function () {
		if (sap.ui.Device.system.phone === true) {
			return true;
		} else {
			return false;
		}
	},
	showFooter: function () {
		if (sap.ui.Device.system.phone === true) {
			return false;
		} else {
			return true;
		}
	},
	showMobileHeader: function () {
		if (sap.ui.Device.system.phone === true) {
			return true;
		} else {
			return false;
		}
	},
	showOrHideReset: function () {
		if (sap.ui.Device.system.phone === true) {
			return false;
		} else {
			return true;
		}
	},
	showOrHidePaginator: function () {
		if (sap.ui.Device.system.phone === true || sap.ui.Device.system.tablet === true) {
			return true;
		} else {
			return false;
		}
	},
	showBarOnNoData: function (val, so) {
		if (so) {
			if (val) {
				return val;
			} else {
				return "-";
			}
		} else {
			return "";
		}
	},
	showOrHideFooter: function () {
		if (sap.ui.Device.system.phone === true) {
			return false;
		} else {
			return true;
		}
	},
	showBarForHeaderDetails: function (val) {
		if (val) {
			return val;

		} else {
			return "-";
		}
	},
	iconShow: function (val) {
			return sap.ui.Device.system.phone;
		}
		// showScrlCnt: function (system) {
		// 		if (sap.ui.Device.system.phone === true || sap.ui.Device.system.tablet === true) {
		// 			return true;
		// 		} else {
		// 			return false;
		// 		}
		// 	}
		// setColorValue: function (desc, type) {
		// 		console.log(type);
		// 		console.log(this);
		// 		// var sId = this.getId();
		// 		// sId = sap.ui.getCore().byId(sId);
		// 		// var scope = this;
		// 		// sId.addEventDelegate({
		// 		// 	onAfterRendering: function (evt) {

	// 		// 		if (evt.isDefaultPrevented()) {
	// 		// 			return;
	// 		// 		}
	// 		// 		evt.preventDefault();
	// 		if (type === "brand" || type === "category") {
	// 			console.log("color Applied");
	// 			$("#" + this.getId()).removeClass("subCatogoryColorCls");
	// 			$("#" + this.getId()).addClass("brandColorCls");
	// 			// console.log(evt);
	// 		} else if (type === "subCategory" || type === "SKU") {
	// 			console.log("subcatogory color Applied");
	// 			$("#" + this.getId()).removeClass("brandColorCls");
	// 			$("#" + this.getId()).addClass("subCatogoryColorCls");
	// 		} else {
	// 			$("#" + this.getId()).removeClass("subCatogoryColorCls");
	// 		}
	// 		return desc;

	// 	}
	// });

};