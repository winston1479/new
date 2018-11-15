sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/model/Filter",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/m/MessageToast"
	// "sap/ui/model/resouce"

], function (Controller, ODataModel, Filter, Export, ExportTypeCSV) {
	"use strict";
	jQuery.sap.require("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.oDataOperations");
	jQuery.sap.require("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.formatter");
	jQuery.sap.require("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.underscore");
	jQuery.sap.require("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.LoadingIcon");
	// jQuery.sap.require("zzuru.orders.orderSummaryZ_ORD_SUMMARY.i18n.i18n");
	var flagforPagination = 0,
		stopReading = false,
		skip = 50,
		top = 50,
		pageNo = 1,
		totalPages,
		initialSkip = true,
		hierarchyArrayList,
		skipValForMbl = 0,
		oControl = null;

	return Controller.extend("zzuru.orders.orderSummaryZ_ORD_SUMMARY.controller.TableView", {
		oDataOperations: null,
		_oView: null,
		_oComponent: null,
		_customerFilterKey: null,
		_salesPersonFilterKey: null,
		_orderTypeFilterKey: null,
		_dateFilterDialog: null,
		_filterYear: null,
		filterFlag: null,
		busyDialog: null,
		searchStatusInd: false,
		onInit: function () {
			oControl = sap.ui.getCore().byId("__xmlview1").getController();
			if (!sap.ui.Device.system.phone) {
				sap.ui.getCore().byId("__xmlview1--outboundSplitAppId-MasterBtn").setVisible(false);
				//	$("#__xmlview1--outboundSplitAppId-MasterBtn").css("display", "none");
			}
			//initialize util service
			// sap.ui.core.BusyIndicator.show();
			if (!this.busyDialog) {
				this.busyDialog = sap.ui.xmlfragment("zzuru.orders.orderSummaryZ_ORD_SUMMARY.fragments.Busydialog", this);
				this.getView().addDependent(this.busyDialog);
			}

			var sServiceUrl = "/sap/opu/odata/sap/ZUTIL_SRV/";
			this.utilModel = new ODataModel(sServiceUrl, {
				json: true,
				loadMetadataAsync: true,
				skipMetadataAnnotationParsing: true,
				defaultCountMode: "None"
			});

			this.globalFiltersArr = [];
			this.aSorters = [];
			this.customerArr = [];
			this.customerArrClone = [];
			this.salesPersonArr = [];
			this.salesPersonArrClone = [];
			this.orderListArr = [];
			this.orderListArrClone = [];

		},
		getSplitAppObj: function () {
			var result = this.byId("outboundSplitAppId");
			if (!result) {
				alert("SplitApp object can't be found");
			}
			return result;
		},
		orientationCheck: function () {
			if ((sap.ui.Device.system.phone || sap.ui.Device.system.tablet) && sap.ui.Device.orientation.portrait) {
				sap.ui.getCore().byId("__xmlview1--overallPanel").setVisible(false);
				sap.ui.getCore().byId("__xmlview1--hidePortrait").setVisible(true);
				sap.ui.getCore().byId("__xmlview1--secondView").setShowFooter(false);
			} else {
				sap.ui.getCore().byId("__xmlview1--overallPanel").setVisible(true);
				sap.ui.getCore().byId("__xmlview1--hidePortrait").setVisible(false);
				sap.ui.getCore().byId("__xmlview1--secondView").setShowFooter(true);
				$("#__xmlview1--orderSummaryCommonInfo").css("display", "none");
			}
		},
		onAfterRendering: function () {
			setTimeout(function () {
				if (sap.ui.Device.system.phone) {
					// this.checkOrientation();
					oControl.brandwise = 'X';
					$('#__xmlview1--orderSummaryCommonInfo').removeClass('displayHeaderInfo');
					$('#__xmlview1--orderSummaryCommonInfo').addClass('displayBlockInPhn');
					oControl.setDynamicTableRowCount();
					oControl.orientationCheck();
				}
			}, 100);
			sap.ui.Device.orientation.attachHandler(function (oEvt) {
				oControl.orientationCheck();
				setTimeout(function () {
					if (oControl.brandwise == 'X') {
						$('#__xmlview1--orderSummaryCommonInfo').removeClass('displayHeaderInfo');
						$('#__xmlview1--orderSummaryCommonInfo').addClass('displayBlockInPhn');
					}
					oControl.setDynamicTableRowCount();
				}, 100);
			});
			this.getSplitAppObj().to(this.createId("secondView"));
			sap.ui.getCore().byId("BusyDialog").open(0);
			this.oDataOperations = new zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.oDataOperations();
			//removing the busy indicator element that is added in the index.html to avoid glitches on the UI since we do not need it anymore
			$("#zuru-initial-busy-indicator").remove();
			if (sap.ui.Device.system.tablet === true) {
				//	sap.ui.getCore().byId("__xmlview1--outboundSplitAppId-Master").setVisible(false);
				$("#__xmlview1--outboundSplitAppId-Master").css("display", "none");
			}
			// var appId = sap.ui.getCore().byId("__app1");
			// if (appId) {
			// 	appId.setBusy(true);
			// }
			this._oView = this.getView();
			this._oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));
			this._oModel = this._oComponent.getModel();

			if (!this._filterDialog) {
				this._filterDialog = sap.ui.xmlfragment("zzuru.orders.orderSummaryZ_ORD_SUMMARY.fragments.FilterDlg", this);
				this.getView().addDependent(this._filterDialog);
			}
			if (!this._dateFilterDialog) {
				this._dateFilterDialog = sap.ui.xmlfragment("zzuru.orders.orderSummaryZ_ORD_SUMMARY.fragments.DateFilter", this);
				this.getView().addDependent(this._dateFilterDialog);
			}
			if (this._oModel.getServiceMetadata() !== undefined) {
				this.loadFilterValues();
				this.loadDetailTableValues();
			} else {
				this._oModel.attachMetadataLoaded(this, jQuery.proxy(this.onMetadataLoad, this));
			}
			if (sap.ui.Device.system.tablet) {
				$("#__xmlview1--footerDownloadBtn").css("display", "none");
			}
			// start of pagination //
			var scope = this;
			var page = sap.ui.getCore().byId("__xmlview1--secondView");
			page.scrollTop = 0;
			var scope = this;
			// var resultCount;
			var oTable, oController;
			oController = sap.ui.getCore().byId("__xmlview1").getController();
			oTable = this.getView().byId("detailTable");
			oTable.addEventDelegate({
				onAfterRendering: function () {
					$(".sapUiTableCtrlScr, .sapUiTableVSb , .detailTblScr").on("DOMMouseScroll mousewheel scroll", function (e) {

						var self = oTable.$().find(".sapUiScrollBar > div:eq(0)");
						if (self.scrollTop() !== 0 && self[0].scrollHeight - self.scrollTop() <= (self.height() + self[0].scrollHeight / 6)) {
							if (flagforPagination === 0) {
								if (!stopReading) {
									// var aFilters = [];
									if (sap.ui.Device.system.phone === false && sap.ui.Device.system.tablet === false) {

										if (scope.globalFiltersArr.length === 0) {
											var orderStatusKey;
											var soYear = sap.ui.getCore().byId("idYearList").getSelectedItem().getTitle();
											if (sap.ui.Device.system.phone === false) {
												orderStatusKey = sap.ui.getCore().byId("__xmlview1--orderStatusBtn").getSelectedKey();
											} else {
												var orderStatudTypeId = sap.ui.getCore().byId("idOrderStatusList").getSelectedItem().getId();
												orderStatusKey = sap.ui.getCore().byId(orderStatudTypeId).data("key");
											}
											var salesOrgYear = new sap.ui.model.Filter("SoYear", sap.ui.model.FilterOperator.EQ, soYear);
											scope.globalFiltersArr.push(salesOrgYear);
											var orderStatus = new sap.ui.model.Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, orderStatusKey);
											scope.globalFiltersArr.push(orderStatus);
										}
										oController.triggerPagination("/DetailViewSet", scope.globalFiltersArr, oTable, scope._oModel, "DetailViewSet");
										// skip, top, "", "", "", "",
										// 	"",
										// 	true, "Table"
										//	scope.setPaginationCountValue(resultCount);
										flagforPagination++;
									}
								}
							}
						}
					});
					$("body").on('touchmove', ".sapUiTableCtrlScr, .sapUiTableVSb, .sapUiScrollBar , .detailTblScr", function (event) {
						var self = oTable.$().find(".sapUiScrollBar > div:eq(0)");

						if (self.scrollTop() !== 0 && self[0].scrollHeight - self.scrollTop() <= (self.height() + self[0].scrollHeight / 6)) {
							if (flagforPagination === 0) {
								if (!stopReading) {
									if (sap.ui.Device.system.phone === false && sap.ui.Device.system.tablet === false) {

										if (scope.globalFiltersArr.length === 0) {
											var orderStatusKey;
											var soYear = sap.ui.getCore().byId("idYearList").getSelectedItem().getTitle();
											if (sap.ui.Device.system.phone === false) {
												orderStatusKey = sap.ui.getCore().byId("__xmlview1--orderStatusBtn").getSelectedKey();
											} else {
												var orderStatudTypeId = sap.ui.getCore().byId("idOrderStatusList").getSelectedItem().getId();
												orderStatusKey = sap.ui.getCore().byId(orderStatudTypeId).data("key");
											}
											var salesOrgYear = new sap.ui.model.Filter("SoYear", sap.ui.model.FilterOperator.EQ, soYear);
											scope.globalFiltersArr.push(salesOrgYear);
											var orderStatus = new sap.ui.model.Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, orderStatusKey);
											scope.globalFiltersArr.push(orderStatus);
										}
										oController.triggerPagination("/DetailViewSet", scope.globalFiltersArr, oTable, scope._oModel, "DetailViewSet");
										// scope.setPaginationCountValue(resultCount);
										flagforPagination++;
									}
								}
							}
						}
					});
					//Mouse down & Mouse up Event   
					$(".sapUiTableCtrlScr, .sapUiTableVSb, .sapUiScrollBar , .detailTblScr").mousedown(function () {
						var self = oTable.$().find(".sapUiScrollBar > div:eq(0)");
						if (self.scrollTop() !== 0 && self[0].scrollHeight - self.scrollTop() <= (self.height() + self[0].scrollHeight / 6)) {
							if (flagforPagination === 0) {
								if (!stopReading) {
									if (sap.ui.Device.system.phone === false && sap.ui.Device.system.tablet === false) {

										if (scope.globalFiltersArr.length === 0) {
											var orderStatusKey;
											var soYear = sap.ui.getCore().byId("idYearList").getSelectedItem().getTitle();
											if (sap.ui.Device.system.phone === false) {
												orderStatusKey = sap.ui.getCore().byId("__xmlview1--orderStatusBtn").getSelectedKey();
											} else {
												var orderStatudTypeId = sap.ui.getCore().byId("idOrderStatusList").getSelectedItem().getId();
												orderStatusKey = sap.ui.getCore().byId(orderStatudTypeId).data("key");
											}
											var salesOrgYear = new sap.ui.model.Filter("SoYear", sap.ui.model.FilterOperator.EQ, soYear);
											scope.globalFiltersArr.push(salesOrgYear);
											var orderStatus = new sap.ui.model.Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, orderStatusKey);
											scope.globalFiltersArr.push(orderStatus);
										}
										oController.triggerPagination("/DetailViewSet", scope.globalFiltersArr, oTable, scope._oModel, "DetailViewSet");
										// scope.setPaginationCountValue(resultCount);

										flagforPagination++;
									}
								}
							}
						}
					});
					$(".sapUiTableCtrlScr, .sapUiTableVSb, .sapUiScrollBar , .detailTblScr").mouseup(function () {

						var self = oTable.$().find(".sapUiScrollBar > div:eq(0)");
						if (self.scrollTop() !== 0 && self[0].scrollHeight - self.scrollTop() <= (self.height() + self[0].scrollHeight / 6)) {
							if (flagforPagination === 0) {
								if (!stopReading) {
									if (sap.ui.Device.system.phone === false && sap.ui.Device.system.tablet === false) {

										if (scope.globalFiltersArr.length === 0) {
											var orderStatusKey;
											var soYear = sap.ui.getCore().byId("idYearList").getSelectedItem().getTitle();
											if (sap.ui.Device.system.phone == false) {
												orderStatusKey = sap.ui.getCore().byId("__xmlview1--orderStatusBtn").getSelectedKey();
											} else {
												var orderStatudTypeId = sap.ui.getCore().byId("idOrderStatusList").getSelectedItem().getId();
												orderStatusKey = sap.ui.getCore().byId(orderStatudTypeId).data("key");
											}
											var salesOrgYear = new sap.ui.model.Filter("SoYear", sap.ui.model.FilterOperator.EQ, soYear);
											scope.globalFiltersArr.push(salesOrgYear);
											var orderStatus = new sap.ui.model.Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, orderStatusKey);
											scope.globalFiltersArr.push(orderStatus);
										}
										oController.triggerPagination("/DetailViewSet", scope.globalFiltersArr, oTable, scope._oModel, "DetailViewSet");
										// scope.setPaginationCountValue(resultCount);
										flagforPagination++;
									}
								}
							}
						}
					});
					//KeyPress Events  
					$(".sapUiTableCtrlScr, .sapUiTableVSb").keydown(function (e) {
						var self = oTable.$().find(".sapUiScrollBar > div:eq(0)");
						if (self.scrollTop() !== 0 && self[0].scrollHeight - self.scrollTop() <= (self.height() + self[0].scrollHeight / 6)) {
							if (flagforPagination === 0) {
								if (!stopReading) {
									if (sap.ui.Device.system.phone === false && sap.ui.Device.system.tablet === false) {

										if (scope.globalFiltersArr.length === 0) {
											var orderStatusKey;
											var soYear = sap.ui.getCore().byId("idYearList").getSelectedItem().getTitle();
											if (sap.ui.Device.system.phone === false) {
												orderStatusKey = sap.ui.getCore().byId("__xmlview1--orderStatusBtn").getSelectedKey();
											} else {
												var orderStatudTypeId = sap.ui.getCore().byId("idOrderStatusList").getSelectedItem().getId();
												orderStatusKey = sap.ui.getCore().byId(orderStatudTypeId).data("key");
											}
											var salesOrgYear = new sap.ui.model.Filter("SoYear", sap.ui.model.FilterOperator.EQ, soYear);
											scope.globalFiltersArr.push(salesOrgYear);
											var orderStatus = new sap.ui.model.Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, orderStatusKey);
											scope.globalFiltersArr.push(orderStatus);
										}
										oController.triggerPagination("/DetailViewSet", scope.globalFiltersArr, oTable, scope._oModel, "DetailViewSet");
										// scope.setPaginationCountValue(resultCount);
										flagforPagination++;
									}
								}
							}
						}
					});
				}
			});

			this.getView().setBusy(false);
			if (!this._advancedSearchDialog) {
				this._advancedSearchDialog = sap.ui.xmlfragment("zzuru.orders.orderSummaryZ_ORD_SUMMARY.fragments.AdvancedSearch", this);

				this.getView().addDependent(this._advancedSearchDialog);
			}

			sap.ui.getCore().byId("salesOrderNum").onsapenter = function (e) {
				scope.applySearch();
				e.preventDefault();
				return false; // prevent the button click from happening
			};

			sap.ui.getCore().byId("customerPoNo").onsapenter = function (e) {
				scope.applySearch();
				e.preventDefault();
				return false; // prevent the button click from happening
			};

			$("#__xmlview1--orderSummaryCommonInfo").css("visibility", "hidden");

			$("#__xmlview1--advanceSearch-I").click(function () {
				scope._advancedSearchDialog.open();
			});
			var dtlTbl = this.getView().byId("detailTable");
			// dtlTbl.addEventDelegate({
			// 	onAfterRendering: function (evt) {
			// 		if (evt.isDefaultPrevented()) {
			// 			return;
			// 		}
			// 		evt.preventDefault();

			// 	}
			// });
			if (sap.ui.Device.system.phone) {
				for (var i in dtlTbl.getColumns()) {
					var colId = dtlTbl.getColumns()[i].getId();
					sap.ui.getCore().byId(colId).setFilterProperty(null);
					sap.ui.getCore().byId(colId).setSortProperty(null);
					sap.ui.getCore().byId(colId).setResizable(false);
				}
			}
			//Set Default Height to Suggestion dropdown
			var advanceSearchDlgId = sap.ui.getCore().byId("advanceSearchDlg");
			advanceSearchDlgId.addEventDelegate({
				onAfterRendering: function (evt) {
					if (!sap.ui.Device.system.phone) {
						sap.ui.getCore().byId("salesOrderNum-popup").setContentHeight("190px");
						sap.ui.getCore().byId("customerPoNo-popup").setContentHeight("190px");
					}
				}
			});

		},
		checkOrientation: function () {
			var winWidth = $(window).width();
			var winHeight = $(window).height();

			if (winHeight > winWidth) {
				$('body').width(winHeight).height(winWidth); // swap the width and height of BODY if necessary
			}
		},
		sortTable:function(evnt){
			
			var detailViewTable = this.getView().byId("detailTable");
			this.oModel = this.getView().getModel();

			var sPathProperty = evnt.getParameters().column.mProperties.filterProperty;
			var sortOrder = evnt.getParameters().column.mProperties.sortOrder;
			var sortOrderStatus;
			if(sortOrder=="Descending"){
				sortOrderStatus = "desc";
			}else{
				sortOrderStatus = "ASC";
			}
		//	var sortProperty = new sap.ui.model.Sorter(sPathProperty, sortOrderStatus, null, null);
		 var sortProperty = {
		 		"SortOrder":sortOrderStatus,
		 		"Property":sPathProperty
		 	};
			this.aSorters.push(sortProperty);
			
			var aFilters = [], count, orderStatusKey;
			
			var soYear = sap.ui.getCore().byId("idYearList").getModel().getData().YearSet[0].Gjahr;
			orderStatusKey = this.getView().byId("orderStatusBtn").getSelectedKey();
		
			var salesOrgYear = new sap.ui.model.Filter("SoYear", sap.ui.model.FilterOperator.EQ, soYear);
			aFilters.push(salesOrgYear);
			var orderStatus = new sap.ui.model.Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, orderStatusKey);
			aFilters.push(orderStatus);
			console.log(this.globalFiltersArr.length , "globalFiltersArr");
			console.log(aFilters.length , "aFilters");

			if(this.globalFiltersArr.length < 0){
				var count = this.oDataOperations.readOperation("/DetailViewSet", this.globalFiltersArr, detailViewTable, this._oModel, 0, 50, "", "", "", "", "", true, "Table", "DetailViewSet", "", "", this.aSorters);
			}else{
				var count = this.oDataOperations.readOperation("/DetailViewSet", aFilters, detailViewTable, this.oModel, 0, 50, "", "", "", "", "", true, "Table", "DetailViewSet","","",this.aSorters);
			}
			this.setPaginationCountValue(count);
			
		},
		onMetadataLoad: function () {

			this.bindYearSet();
			// console.log("onmetadataloded");
			var scope = this;
			this.oDataOperations = new zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.oDataOperations();

			setTimeout(function () {
				// sap.ui.core.BusyIndicator.hide();
				scope.loadFilterValues();
			}, 1000);
			setTimeout(function () {
				$('sapUiBLy').css("opacity", "0.6");
				//	sap.ui.getCore().byId("BusyDialog").close();

			}, 1000);

		},
		bindYearSet: function () {
			var scope = this;
			sap.ui.core.BusyIndicator.show();
			var oModel = sap.ui.getCore().getModel();
			var mParameters = {
				async: false,
				success: jQuery.proxy(function (oData, oResponse) {
					var oDataJSONModel = new sap.ui.model.json.JSONModel();
					oDataJSONModel = new sap.ui.model.json.JSONModel(oData.results);
					oDataJSONModel.setSizeLimit(10000);
					oDataJSONModel.setData({
						YearSet: oData.results
					});
					sap.ui.getCore().byId("idYearList").setModel(oDataJSONModel);
					// oDataJSONModel.setData({
					// 	YearSet:oData.results
					// });
					sap.ui.getCore().byId("fromDateYear").setModel(oDataJSONModel);
					sap.ui.getCore().byId("toDateYear").setModel(oDataJSONModel);

					//	sap.ui.getCore().byId("fromDateyear").bindItems("/YearSet");
					//	sap.ui.getCore().byId("toDateyear").bindItems("/YearSet");

					// sap.ui.getCore().byId("idYearList").bindItems("/YearSet");
					scope.loadDetailTableValues();
					//console.log(oDataJSONModel);
					sap.ui.core.BusyIndicator.hide();

				}, this),
				error: jQuery.proxy(function (oData, oResponse) {

					var oErrorResponse = jQuery.parseJSON(oData.response.body);
					console.log(oErrorResponse.error.message.value);
					sap.ui.core.BusyIndicator.hide();
					oController.messageBoxError(oErrorResponse.error.message.value);
				}, this)
			};

			oModel.read("/YearSet", mParameters);
		},
		loadDetailTableValues: function () {
			var detailViewTable = this.getView().byId("detailTable");
			var aFilters = [],
				count, orderStatusKey;
			var soYear = sap.ui.getCore().byId("idYearList").getModel().getData().YearSet[0].Gjahr;
			if (sap.ui.Device.system.phone === false) {
				orderStatusKey = this.getView().byId("orderStatusBtn").getSelectedKey();
			} else {
				var orderStatusListItem = sap.ui.getCore().byId("idOrderStatusList").getItems()[0];
				sap.ui.getCore().byId("idOrderStatusList").setSelectedItem(orderStatusListItem);
				var orderStatudTypeId = sap.ui.getCore().byId("idOrderStatusList").getSelectedItem().getId();
				orderStatusKey = sap.ui.getCore().byId(orderStatudTypeId).data("key");
			}
			var salesOrgYear = new sap.ui.model.Filter("SoYear", sap.ui.model.FilterOperator.EQ, soYear);
			aFilters.push(salesOrgYear);
			var orderStatus = new sap.ui.model.Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, orderStatusKey);
			aFilters.push(orderStatus);
			var count = this.oDataOperations.readOperation("/DetailViewSet", aFilters, detailViewTable, this._oModel, 0, 50, "", "", "", "",
				"",
				true, "Table", "DetailViewSet");
			//	count = this.oDataOperations.readOperation("/DetailViewSet", aFilters, detailViewTable, this._oModel, "", "", "", "", "", "",
			//		"",
			//		true, "Table", "DetailViewSet");
			// sap.ui.core.BusyIndicator.hide();
			sap.ui.getCore().byId("BusyDialog").close();
			this.setDynamicTableRowCount();
		},
		setPaginationCountValue: function (count) {
			var fetchedResult = sap.ui.Device.system.phone === true || sap.ui.Device.system.tablet === true ? skipValForMbl + 50 : skip;
			if (fetchedResult < count) {
				sap.ui.getCore().byId("__xmlview1--pagingText").setText("Showing " + fetchedResult + " / " + count);
			} else if (fetchedResult > count) {
				sap.ui.getCore().byId("__xmlview1--pagingText").setText("Showing " + count + " / " + count);
			}
			totalPages = count / 50;
			totalPages = Math.ceil(totalPages);
		},
		setDynamicTableRowCount: function () {
			var that = this;
			if (sap.ui.Device.system.phone === true) {
				sap.ui.getCore().byId("__xmlview1--detailTable").setFixedColumnCount(2);
			} else {
				sap.ui.getCore().byId("__xmlview1--detailTable").setFixedColumnCount(4);
			}
			setTimeout(function () {
				var windowHeight = window.innerHeight;
				var tableRowHeight, orderSummaryCommonInfoHeaderHeight;
				// console.log(windowHeight, "windowHeight")
				var pageHeaderHeight = $("#__xmlview1--secondView-intHeader").height();
				// console.log(pageHeaderHeight, "pageHeaderHeight");
				if (that.brandwise !== 'X') {
					orderSummaryCommonInfoHeaderHeight = $("#__xmlview1--orderSummaryCommonInfo").height();

				} else {
					orderSummaryCommonInfoHeaderHeight = 0;
				}
				// console.log(orderSummaryCommonInfoHeaderHeight, "orderSummaryCommonInfoHeaderHeight");
				var tabelHeaderHeight = $(".sapUiTableColHdrCnt").height();
				// console.log(tabelHeaderHeight, "tabelHeaderHeight");
				// var tabelHeight = $("#__xmlview1--detailTable-sapUiTableGridCnt").height();
				// console.log(tabelHeight, "tabelHeight");
				var footerHeight = $("#__xmlview1--footerBar").height();
				// console.log(footerHeight, "footerHeight");

				var tabelCenterHeight = windowHeight - pageHeaderHeight - orderSummaryCommonInfoHeaderHeight - tabelHeaderHeight -
					footerHeight;
				// console.log(tabelCenterHeight, "tabelCenterHeight");
				if (sap.ui.Device.system.phone === true) {
					tableRowHeight = $("#__xmlview1--detailTable-rows-row0").height();
				} else {
					tableRowHeight = $("#__xmlview1--detailTable-rows-row0-fixed").height();
				}
				// console.log(tableRowHeight, "tableRowHeight");

				var customRowCount = Math.floor(tabelCenterHeight / tableRowHeight);
				// console.log(customRowCount, "customRowCount");

				sap.ui.getCore().byId("__xmlview1--detailTable").setVisibleRowCount(customRowCount - 1);
				if (sap.ui.Device.system.phone) {
					sap.ui.getCore().byId("__xmlview1--detailTable").setVisibleRowCount(customRowCount);
				}
				sap.ui.getCore().byId("__xmlview1--detailTable").rerender();
			}, 1000);

		},
		navigateToOrderView: function (oEvent) {
			// alert("Link is Clicked");
			sap.ui.getCore().byId("BusyDialog").open();
			var pageURL = window.location.href;
			var router = sap.ui.core.UIComponent.getRouterFor(this);
			var salesOrderNo = oEvent.getSource().getText();
			if (sap.ui.Device.system.phone === true || sap.ui.Device.system.tablet === true) {

				router.navTo("OrderView", {
					salesOrderNumber: salesOrderNo

				});
			} else if (pageURL.indexOf("webide") > -1) {
				var URLLen = (pageURL.length) - 1;
				var hashPresence = pageURL.charAt(URLLen);
				pageURL = hashPresence !== "#" ? pageURL + "#" : pageURL;
				window.open(pageURL + "/SaleOrderNo/" + salesOrderNo);
			} else {
				sap.m.URLHelper.redirect("/fiori?sap-ushell-config=headerless#ZORDER_SUMMARY-display" + "&" + "/SaleOrderNo/" + salesOrderNo,
					true);
			}
			sap.ui.getCore().byId("BusyDialog").close();
		},
		loadFilterValues: function () {

			var customerList = sap.ui.getCore().byId("idCustomerList");
			this.oDataOperations.readOperation("/CustomerSet", "", customerList, this._oModel, "", "", "", "", "", "", "", false, "",
				"CustomerSet", "", "X");

			var hierarchyTbl = sap.ui.getCore().byId("hierarchyTable");
			this.oDataOperations.readOperation("/HierarchyTreeSet", "", hierarchyTbl, this.utilModel, "", "", "", "", "", "", "X", false, "",
				"HierarchyTreeSet", "X", "X");

			var salesPersonList = sap.ui.getCore().byId("idSalesPersonList");
			this.oDataOperations.readOperation("/SalesPersonSet", "", salesPersonList, this._oModel, "", "", "", "", "", "", "", false, "",
				"SalesPersonSet", "X", "X");

			var orderTypeList = sap.ui.getCore().byId("idOrderList");
			this.oDataOperations.readOperation("/SalesOrderTypeSet", "", orderTypeList, this._oModel, "", "", "", "", "", "", "", false, "",
				"SalesOrderTypeSet", "X", "X");

			var currentYear = sap.ui.getCore().byId("idYearList").getItems()[0];
			sap.ui.getCore().byId("idYearList").setSelectedItem(currentYear);

			var orderStatusListItem = sap.ui.getCore().byId("idOrderStatusList").getItems()[0];
			sap.ui.getCore().byId("idOrderStatusList").setSelectedItem(orderStatusListItem);
			// sap.ui.getCore().byId("filterDlg").getFilterItems()[5].setFilterCount(1);
			var regionTree = sap.ui.getCore().byId("regionTreeTable");
			this.oDataOperations.readOperation("/RegionCountryTreeSet", "", regionTree, this.utilModel, "", "", "", "", "", "", "X", false,
				"",
				"RegionCountryTreeSet", "X", "");

		},

		onFilterOpen: function (evt) {
			this._filterDialog.open("filter");
			sap.ui.getCore().byId("fromDateYear").setEditable(false);
			sap.ui.getCore().byId("fromDateMonth").setEditable(false);
			sap.ui.getCore().byId("fromDateDay").setEditable(false);
			
			sap.ui.getCore().byId("toDateYear").setEditable(false);
			sap.ui.getCore().byId("toDateMonth").setEditable(false);
			sap.ui.getCore().byId("toDateDay").setEditable(false);
			
			var listId;
			var hierarchyTreeTbl = sap.ui.getCore().byId("hierarchyTable");
			sap.ui.getCore().byId("filterDlg-filterlist").fireItemPress();
			// hierarchyTreeTbl.addEventDelegate({
			// 	onAfterRendering: function (evt) {
			// 		console.log(evt)
			// 	}
			// });
			if (sap.ui.Device.system.phone === false) {
				listId = sap.ui.getCore().byId("filterDlg-filterlist").getItems()[6].sId;
				sap.ui.getCore().byId(listId).setVisible(false);

			} else {
				listId = sap.ui.getCore().byId("filterDlg-filterlist").getItems()[6].sId;
				sap.ui.getCore().byId(listId).setVisible(true);

			}
			if (this.customerArrClone.length == 0) {
				this.customerArrClone = sap.ui.getCore().byId("idCustomerList").getModel().getData().CustomerSet;
			}
			if (this.salesPersonArrClone.length == 0) {
				this.salesPersonArrClone = sap.ui.getCore().byId("idSalesPersonList").getModel().getData().SalesPersonSet;
			}
			if (this.orderListArrClone.length == 0) {
				this.orderListArrClone = sap.ui.getCore().byId("idOrderList").getModel().getData().SalesOrderTypeSet;
			}
			if (!hierarchyArrayList) {
				var hierarchyArray = sap.ui.getCore().byId('hierarchyTable').getModel().getData();
				hierarchyArrayList = hierarchyArray.HierarchyTreeSet.rows === undefined ? hierarchyArray.HierarchyTreeSet : hierarchyArray.HierarchyTreeSet
					.rows;
			}
		},
		clearFilter: function (oEvent) {
			var oTable, path;
			oTable = sap.ui.getCore().byId("__xmlview1--detailTable");
			var oListBinding = oTable.getBinding();
			if (oListBinding) {
				oListBinding.aSorters = null;
				oListBinding.aFilters = null;
			}
			// oListBinding.aApplicationFilters = [];
			// oListBinding.aFilters = [];
			for (var iColCounter = 0; iColCounter < oTable.getColumns().length; iColCounter++) {
				oTable.getColumns()[iColCounter].setSorted(false);
				oTable.getColumns()[iColCounter].setFilterValue("");
				oTable.getColumns()[iColCounter].setFiltered(false);
			}
			oTable.getModel().refresh(true);
		},
		onCheckHierarchy: function (evt) {
			//this obj will contain hierarchy level data of the item
			var customData = evt.getSource().data();
			var selectionStateValue = evt.getParameters().selectionState;
			customData.selectValue = selectionStateValue;

			//Brand Checked & Unchecked
			if (customData.Type == "brand") {
				for (var i = 0; i < hierarchyArrayList.length; i++) {
					if (hierarchyArrayList[i].selected == "Checked" && hierarchyArrayList[i].type == "brand") {
						for (var j = 0; j < hierarchyArrayList[i].rows.length; j++) {
							hierarchyArrayList[i].rows[j].selected = "Checked";
							for (var k = 0; k < hierarchyArrayList[i].rows[j].rows.length; k++) {
								hierarchyArrayList[i].rows[j].rows[k].selected = "Checked";
								for (var l = 0; l < hierarchyArrayList[i].rows[j].rows[k].rows.length; l++) {
									hierarchyArrayList[i].rows[j].rows[k].rows[l].selected = "Checked";
								}
							}
						}
					} else if (hierarchyArrayList[i].selected == "Unchecked" && hierarchyArrayList[i].type == "brand") {
						for (var j = 0; j < hierarchyArrayList[i].rows.length; j++) {
							hierarchyArrayList[i].rows[j].selected = "Unchecked";
							for (var k = 0; k < hierarchyArrayList[i].rows[j].rows.length; k++) {
								hierarchyArrayList[i].rows[j].rows[k].selected = "Unchecked";
								for (var l = 0; l < hierarchyArrayList[i].rows[j].rows[k].rows.length; l++) {
									hierarchyArrayList[i].rows[j].rows[k].rows[l].selected = "Unchecked";
								}
							}
						}
					}
				}
			}

			//Categrory Checked & Unchecked
			if (customData.Type == "category") {
				var cateSelectLength = 0;
				for (var i = 0; i < hierarchyArrayList.length; i++) {
					if (hierarchyArrayList[i].value == customData.brand) {
						for (var j = 0; j < hierarchyArrayList[i].rows.length; j++) {
							if (hierarchyArrayList[i].rows[j].selected == "Checked") {
								hierarchyArrayList[i].rows[j].selected = "Checked";
								for (var k = 0; k < hierarchyArrayList[i].rows[j].rows.length; k++) {
									hierarchyArrayList[i].rows[j].rows[k].selected = "Checked";
									for (var l = 0; l < hierarchyArrayList[i].rows[j].rows[k].rows.length; l++) {
										hierarchyArrayList[i].rows[j].rows[k].rows[l].selected = "Checked";
									}
								}
								cateSelectLength++;
							} else if (hierarchyArrayList[i].rows[j].selected == "Unchecked") {
								hierarchyArrayList[i].rows[j].selected = "Unchecked";
								for (var k = 0; k < hierarchyArrayList[i].rows[j].rows.length; k++) {
									hierarchyArrayList[i].rows[j].rows[k].selected = "Unchecked";
									for (var l = 0; l < hierarchyArrayList[i].rows[j].rows[k].rows.length; l++) {
										hierarchyArrayList[i].rows[j].rows[k].rows[l].selected = "Unchecked";
									}
								}
							}
						}
					}
				}

				//All Categrory Select to Brand Checked & Unchecked
				for (var m = 0; m < hierarchyArrayList.length; m++) {
					for (var n = 0; n < hierarchyArrayList[m].rows.length; n++) {
						if (cateSelectLength == hierarchyArrayList[m].rows.length) {
							if (hierarchyArrayList[m].value == customData.brand) {
								hierarchyArrayList[m].selected = "Checked";
							}
						} else if (cateSelectLength == "0") {
							if (hierarchyArrayList[m].value == customData.brand) {
								hierarchyArrayList[m].selected = "Unchecked";
							}
						} else if (cateSelectLength > "0" && cateSelectLength < hierarchyArrayList[m].rows.length) {
							if (hierarchyArrayList[m].value == customData.brand) {
								hierarchyArrayList[m].selected = "Mixed";
							}
						}
					}
				}
				//console.log(cateSelectLength, "cateSelectLength");
			}

			//Sub Categrory Checked & Unchecked
			if (customData.Type == "subCategory") {
				var subCateSelectLength = 0;
				var categorySelLen = 0;
				for (var i = 0; i < hierarchyArrayList.length; i++) {
					if (hierarchyArrayList[i].value == customData.brand) {
						for (var j = 0; j < hierarchyArrayList[i].rows.length; j++) {
							if (hierarchyArrayList[i].rows[j].value == customData.catogory) {
								for (var k = 0; k < hierarchyArrayList[i].rows[j].rows.length; k++) {
									if (hierarchyArrayList[i].rows[j].rows[k].selected == "Checked") {
										hierarchyArrayList[i].rows[j].rows[k].selected = "Checked";
										for (var l = 0; l < hierarchyArrayList[i].rows[j].rows[k].rows.length; l++) {
											hierarchyArrayList[i].rows[j].rows[k].rows[l].selected = "Checked";
										}

										subCateSelectLength++;
									} else if (hierarchyArrayList[i].rows[j].rows[k].selected == "Unchecked") {
										hierarchyArrayList[i].rows[j].rows[k].selected = "Unchecked";
										hierarchyArrayList[i].rows[j].selected = "Unchecked";
										for (var l = 0; l < hierarchyArrayList[i].rows[j].rows[k].rows.length; l++) {
											hierarchyArrayList[i].rows[j].rows[k].rows[l].selected = "Unchecked";
										}
									}
								}
							}
							if (hierarchyArrayList[i].rows[j].selected == "Checked") {
								categorySelLen++;
							}
						}
					}
				}

				//All Sub Categrory Select to Categrory Checked & Unchecked
				for (var m = 0; m < hierarchyArrayList.length; m++) {
					if (hierarchyArrayList[m].value == customData.brand) {
						for (var n = 0; n < hierarchyArrayList[m].rows.length; n++) {
							if (hierarchyArrayList[m].rows[n].value == customData.catogory) {
								for (var o = 0; o < hierarchyArrayList[m].rows[n].rows.length; o++) {
									if (subCateSelectLength == hierarchyArrayList[m].rows[n].rows.length) {
										hierarchyArrayList[m].rows[n].selected = "Checked";
										if (hierarchyArrayList[m].rows[n].selected == "Checked") {
											categorySelLen++;
										}
										if (categorySelLen == hierarchyArrayList[m].rows[n].rows.length) {
											hierarchyArrayList[m].selected = "Checked";
										}
									} else if (subCateSelectLength == "0") {
										hierarchyArrayList[m].rows[n].selected = "Unchecked";
										if (categorySelLen == "0") {
											hierarchyArrayList[m].selected = "Unchecked";
										} else if (categorySelLen > "0" && categorySelLen < hierarchyArrayList[m].rows.length) {
											hierarchyArrayList[m].selected = "Mixed";
										}
									} else if (subCateSelectLength > "0" && subCateSelectLength < hierarchyArrayList[m].rows[n].rows.length) {
										hierarchyArrayList[m].rows[n].selected = "Mixed";
										hierarchyArrayList[m].selected = "Mixed";
									}
								}
							}
						}
					}
				}
			}

			//SKU Checked & Unchecked

			if (customData.brand != "" && customData.catogory == "" && customData.SubCatogory == "" && customData.Type == "SKU") {

				var skuSelectedLength = "0";
				for (var m = 0; m < hierarchyArrayList.length; m++) {
					if (hierarchyArrayList[m].value == customData.brand) {
						for (var n = 0; n < hierarchyArrayList[m].rows.length; n++) {
							if (hierarchyArrayList[m].rows[n].selected == "Checked") {
								skuSelectedLength++;
							}
						}
						if (hierarchyArrayList[m].rows.length == skuSelectedLength) {
							hierarchyArrayList[m].selected = "Checked";
						} else if (skuSelectedLength == "0") {
							hierarchyArrayList[m].selected = "Unchecked";
						} else if (skuSelectedLength > "0" && skuSelectedLength < hierarchyArrayList[m].rows.length) {
							hierarchyArrayList[m].selected = "Mixed";
						}
					}
				}
			}

			if (customData.brand != "" && customData.catogory != "" && customData.SubCatogory == "" && customData.Type == "SKU") {

				var skuSelectedLength = "0";
				for (var m = 0; m < hierarchyArrayList.length; m++) {
					if (hierarchyArrayList[m].value == customData.brand) {
						for (var n = 0; n < hierarchyArrayList[m].rows.length; n++) {
							if (hierarchyArrayList[m].rows[n].value == customData.catogory) {
								for (o = 0; o < hierarchyArrayList[m].rows[n].rows.length; o++) {
									if (hierarchyArrayList[m].rows[n].rows[o].selected == "Checked") {
										skuSelectedLength++;
									}
								}

								if (hierarchyArrayList[m].rows[n].rows.length == skuSelectedLength) {
									hierarchyArrayList[m].rows[n].selected = "Checked";
									hierarchyArrayList[m].selected = "Checked";
								} else if (skuSelectedLength == "0") {
									hierarchyArrayList[m].rows[n].selected = "Unchecked";
								} else if (skuSelectedLength > "0" && skuSelectedLength < hierarchyArrayList[m].rows[n].rows.length) {
									hierarchyArrayList[m].rows[n].selected = "Mixed";
									hierarchyArrayList[m].selected = "Mixed";
								}
							}
						}
					}
				}
			}

			if (customData.brand != "" && customData.catogory != "" && customData.SubCatogory != "" && customData.Type == "SKU") {

				var skuSelectedLength = "0";
				for (var m = 0; m < hierarchyArrayList.length; m++) {
					if (hierarchyArrayList[m].value == customData.brand) {
						for (var n = 0; n < hierarchyArrayList[m].rows.length; n++) {
							if (hierarchyArrayList[m].rows[n].value == customData.catogory) {
								for (var o = 0; o < hierarchyArrayList[m].rows[n].rows.length; o++) {
									if (hierarchyArrayList[m].rows[n].rows[o].value == customData.SubCatogory) {
										for (var p = 0; p < hierarchyArrayList[m].rows[n].rows[o].rows.length; p++) {
											if (hierarchyArrayList[m].rows[n].rows[o].rows[p].selected == "Checked") {
												skuSelectedLength++;
											}
										}

										if (hierarchyArrayList[m].rows[n].rows[o].rows.length == skuSelectedLength) {
											hierarchyArrayList[m].rows[n].rows[o].selected = "Checked";
											hierarchyArrayList[m].rows[n].selected = "Checked";
											hierarchyArrayList[m].selected = "Checked";
										} else if (skuSelectedLength == "0") {
											hierarchyArrayList[m].rows[n].rows[o].selected = "Unchecked";
											hierarchyArrayList[m].rows[n].selected = "Unchecked";
											hierarchyArrayList[m].selected = "Unchecked";
										} else if (skuSelectedLength > "0" && skuSelectedLength < hierarchyArrayList[m].rows[n].rows[o].rows.length) {
											hierarchyArrayList[m].rows[n].rows[o].selected = "Mixed";
											hierarchyArrayList[m].rows[n].selected = "Mixed";
											hierarchyArrayList[m].selected = "Mixed";
										}
									}
								}
							}
						}
					}
				}
			}
		},
		onCheckRegion: function (evt) {

			var customData = evt.getSource().data();
			var regionCountryData = sap.ui.getCore().byId("regionTreeTable").getModel().getData().RegionCountryTreeSet;
			regionCountryData = regionCountryData.rows === undefined ? regionCountryData : regionCountryData.rows;
			var regionCountryDataClone = regionCountryData.slice();
			if (evt.getSource().data("Type") === "Continent" && evt.getParameters().selectionState === "Checked") {
				var selectedContinent = evt.getSource().data("value");
				var selectedContinentArr = _.filter(regionCountryData, function (obj) {
					return obj.value === selectedContinent;
				});
				selectedContinentArr = selectedContinentArr[0].rows;
				for (var j in selectedContinentArr) {
					selectedContinentArr[j].selected = "Checked";
				}

			} else if (evt.getSource().data("Type") === "Continent" && evt.getParameters().selectionState === "Unchecked") {
				selectedContinent = evt.getSource().data("value");
				selectedContinentArr = _.filter(regionCountryData, function (obj) {
					return obj.value === selectedContinent;
				});
				selectedContinentArr = selectedContinentArr[0].rows;
				for (j in selectedContinentArr) {
					selectedContinentArr[j].selected = "Unchecked";
				}

			}
			if (evt.getSource().data("Type") === "country" && evt.getParameters().selectionState === "Checked") {
				var selectionCount = 0;
				var selectedCountry = evt.getSource().data("value");
				var selectedCountryParent = evt.getSource().data("continent");
				selectedContinentArr = _.filter(regionCountryData, function (obj) {
					return obj.value === selectedCountryParent;
				});
				var selectedCountrytArr = selectedContinentArr[0].rows;
				var selectionCountryArrLen = selectedCountrytArr.length;
				for (var i in selectedCountrytArr) {
					if (selectedCountrytArr[i].selected === "Checked") {
						selectionCount++;
						if (selectionCount === selectionCountryArrLen) {
							selectedContinentArr[0].selected = "Checked";
						} else {
							selectedContinentArr[0].selected = "Mixed";
						}
					}
				}
			} else if (evt.getSource().data("Type") === "country" && evt.getParameters().selectionState === "Unchecked") {
				selectionCount = 0;
				selectedCountry = evt.getSource().data("value");
				selectedCountryParent = evt.getSource().data("continent");
				selectedContinentArr = _.filter(regionCountryData, function (obj) {
					return obj.value === selectedCountryParent;
				});
				selectedCountrytArr = selectedContinentArr[0].rows;
				selectionCountryArrLen = selectedCountrytArr.length;
				for (i in selectedCountrytArr) {
					if (selectedCountrytArr[i].selected === "Checked") {
						selectionCount++;
					}
				}
				if (selectionCount === 0) {
					selectedContinentArr[0].selected = "Unchecked";
				} else if (selectionCount === selectionCountryArrLen) {
					selectedContinentArr[0].selected = "Checked";
				} else {
					selectedContinentArr[0].selected = "Mixed";
				}
			}

		},
		onSearch: function (evt) {
			sap.ui.getCore().byId("salesOrderNum").setValue("");
			sap.ui.getCore().byId("customerPoNo").setValue("");
			this._advancedSearchDialog.open();
		},
		onCustomerClick: function (evt) {
			console.log(evt);
		},
		onClose: function () {
			this._advancedSearchDialog.close();
		},
		openFilter: function (evt) {
			// if (!this._filterDialog) {
			// 	this._filterDialog = sap.ui.xmlfragment("zzuru.orders.orderSummaryZ_ORD_SUMMARY.fragments.FilterDlg", this);
			// 	this.getView().addDependent(this._filterDialog);
			// }
			// console.log(evt);
			this._filterDialog.open();
		},

		onSelectionChange: function (evt) {
			// this.resetVar();
			var Key = evt.getParameters().listItem.data("key");
			if (evt.getParameters().listItem.data("list") === "Customer") {
				if (evt.getParameters().selected === true) {
					var customerSelections = sap.ui.getCore().byId("idCustomerList").getSelectedItems();
					this.customerArr = [];
					for (var i in customerSelections) {
						var selectionId = customerSelections[i].sId;
						var selectedKey = sap.ui.getCore().byId(selectionId).data("key");
						this.customerArr.push(selectedKey);
					}
					sap.ui.getCore().byId("filterDlg").getFilterItems()[1].setFilterCount(this.customerArr.length);
				} else if (evt.getParameters().selected === false) {

					customerSelections = sap.ui.getCore().byId("idCustomerList").getSelectedItems();

					this.customerArr = [];
					for (i in customerSelections) {
						selectionId = customerSelections[i].sId;
						selectedKey = sap.ui.getCore().byId(selectionId).data("key");
						this.customerArr.push(selectedKey);
					}
					sap.ui.getCore().byId("filterDlg").getFilterItems()[1].setFilterCount(this.customerArr.length);
				}

			} else if (evt.getParameters().listItem.data("list") === "SalesPerson") {
				if (evt.getParameters().selected === true) {
					var salesPersonSelections = sap.ui.getCore().byId("idSalesPersonList").getSelectedItems();
					this.salesPersonArr = [];
					for (i in salesPersonSelections) {
						selectionId = salesPersonSelections[i].sId;
						selectedKey = sap.ui.getCore().byId(selectionId).data("key");
						this.salesPersonArr.push(selectedKey);
					}
					sap.ui.getCore().byId("filterDlg").getFilterItems()[2].setFilterCount(this.salesPersonArr.length);
				} else if (evt.getParameters().selected === false) {
					salesPersonSelections = sap.ui.getCore().byId("idSalesPersonList").getSelectedItems();
					this.salesPersonArr = [];
					for (i in salesPersonSelections) {
						selectionId = salesPersonSelections[i].sId;
						selectedKey = sap.ui.getCore().byId(selectionId).data("key");
						this.salesPersonArr.push(selectedKey);

					}
					sap.ui.getCore().byId("filterDlg").getFilterItems()[2].setFilterCount(this.salesPersonArr.length);
				}
			} else if (evt.getParameters().listItem.data("list") === "OrderList") {
				if (evt.getParameters().selected === true) {
					var orderListSelections = sap.ui.getCore().byId("idOrderList").getSelectedItems();
					this.orderListArr = [];
					for (i in orderListSelections) {
						selectionId = orderListSelections[i].sId;
						selectedKey = sap.ui.getCore().byId(selectionId).data("key");
						this.orderListArr.push(selectedKey);

					}
					sap.ui.getCore().byId("filterDlg").getFilterItems()[4].setFilterCount(this.orderListArr.length);
				} else if (evt.getParameters().selected === false) {
					orderListSelections = sap.ui.getCore().byId("idOrderList").getSelectedItems();
					this.orderListArr = [];
					for (var i in orderListSelections) {
						selectionId = orderListSelections[i].sId;
						selectedKey = sap.ui.getCore().byId(selectionId).data("key");
						this.orderListArr.push(selectedKey);

					}
					sap.ui.getCore().byId("filterDlg").getFilterItems()[4].setFilterCount(this.orderListArr.length);
				}
			}

		},

		handleConfirm: function (orderChange) {
			this.detailTable = this.getView().byId("detailTable");
			this.oModel = this.getView().getModel();
			this.globalFiltersArr = [];
			stopReading = false;
			skip = 50;
			var orderStatudTypeId, orderStatusKey, orderStatus, tblscrl;
			if (this.searchStatusInd === true) {
				var salesOrderVal = sap.ui.getCore().byId("salesOrderNum").getValue();
				var custPoNum = sap.ui.getCore().byId("customerPoNo").getValue();
				if (salesOrderVal || custPoNum) {
					this.globalFiltersArr = [];
					if (salesOrderVal) {
						var salesOrder = new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, salesOrderVal);
						this.globalFiltersArr.push(salesOrder);
					}
					if (custPoNum) {
						var customerPoValue = new sap.ui.model.Filter("Bstnk", sap.ui.model.FilterOperator.EQ, custPoNum);
						this.globalFiltersArr.push(customerPoValue);
					}
					orderStatudTypeId = sap.ui.getCore().byId("idOrderStatusList").getSelectedItem().getId();
					orderStatusKey = sap.ui.getCore().byId(orderStatudTypeId).data("key");
					orderStatus = new sap.ui.model.Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, orderStatusKey);
					this.globalFiltersArr.push(orderStatus);
					var count = this.oDataOperations.readOperation("/DetailViewSet", this.globalFiltersArr, this.detailTable, this.oModel, 0, 50,
						"",
						"", "", "", "",
						true, "Table", "DetailViewSet");
					this.setPaginationCountValue(count);
					tblscrl = this.detailTable.$().find(".sapUiScrollBar > div:eq(0)");
					if (tblscrl) {
						tblscrl.scrollTop(0);
					}
				}
			} else {
				// brand hierarchy filters
				if (hierarchyArrayList) {
					this.getHierarchyFilters();
				}

				this.getCountrySelections();
				if (this.customerArr.length !== 0) {

					this.customerFilterKey = this.customerArr.toString();
					var Customer = new sap.ui.model.Filter("Customer", sap.ui.model.FilterOperator.EQ, this.customerFilterKey);
					this.globalFiltersArr.push(Customer);

				}
				if (this.salesPersonArr.length !== 0) {
					this.salesPersonFilterKey = this.salesPersonArr.toString();
					var salesPerson = new sap.ui.model.Filter("SalesPersonFilter", sap.ui.model.FilterOperator.EQ, this.salesPersonFilterKey);
					this.globalFiltersArr.push(salesPerson);
				}
				if (this.orderListArr.length !== 0) {
					this.orderTypeFilterKey = this.orderListArr.toString();
					var orderType = new sap.ui.model.Filter("OrderType", sap.ui.model.FilterOperator.EQ, this.orderTypeFilterKey);
					this.globalFiltersArr.push(orderType);
				}
				if (sap.ui.Device.system.phone === true) {
					orderStatudTypeId = sap.ui.getCore().byId("idOrderStatusList").getSelectedItem().getId();
					orderStatusKey = sap.ui.getCore().byId(orderStatudTypeId).data("key");
					orderStatus = new sap.ui.model.Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, orderStatusKey);
					this.globalFiltersArr.push(orderStatus);
				} else {
					var orderStatusInd = false;
					for (var i in this.globalFiltersArr) {
						if (this.globalFiltersArr[i].sPath === "OrderStatus") {
							orderStatusInd = true;
						}
					}
					if (orderStatusInd === false) {
						var status = sap.ui.getCore().byId("__xmlview1--orderStatusBtn").getSelectedKey();
						var orderStatusVal = new sap.ui.model.Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, status);
						this.globalFiltersArr.push(orderStatusVal);
					}
				}
				this._filterYear = sap.ui.getCore().byId("idYearList").getSelectedItem().getTitle();
				var year = new sap.ui.model.Filter("SoYear", sap.ui.model.FilterOperator.EQ, this._filterYear);
				this.globalFiltersArr.push(year);

				var count = this.oDataOperations.readOperation("/DetailViewSet", this.globalFiltersArr, this.detailTable, this.oModel, 0, 50,
					"", "", "", "", "", true, "Table", "DetailViewSet");
				// sap.ui.getCore().byId("__xmlview1--filterBtn").addStyleClass("FillterApply");
				if (orderChange !== "X") {
					$("#__xmlview1--filterBtn .sapMBtnInner ").addClass("FillterApply");
					$("#__xmlview1--filterBtn .sapMBtnIcon ").addClass("filterIcon");
					if (sap.ui.Device.system.phone) {
						$("#__xmlview1--filterBtnHeader-img").css("color", "#0071bc");
					}
				}
				// this.resetVar();
				// this.onExit();
				// }
				tblscrl = this.detailTable.$().find(".sapUiScrollBar > div:eq(0)");
				if (tblscrl) {
					tblscrl.scrollTop(0);
				}
				this.setPaginationCountValue(count);
			}
		},
		handleCancel: function () {
			// if (this.customerArr.length !== 0) {
			// 	sap.ui.getCore().byId("idCustomerList").removeSelections(true);
			// }
			// if (this.salesPersonArr.length !== 0) {
			// 	sap.ui.getCore().byId("idSalesPersonList").removeSelections(true);
			// }
			// if (this.orderListArr !== 0) {
			// 	sap.ui.getCore().byId("idOrderList").removeSelections(true);
			// }
			// this.resetTreeTableValues();
			// this.resetListModel();
		},
		getHierarchyFilters: function () {
			var orderSummaryCommonInfo = sap.ui.getCore().byId("__xmlview1--orderSummaryCommonInfo");
			if (hierarchyArrayList.length > 0) {
				var filterHierarcchy = [];
				console.log(hierarchyArrayList, "hierarchyArrayList");
				for (var i = 0; i < hierarchyArrayList.length; i++) {
					if (hierarchyArrayList[i].selected == "Checked" && hierarchyArrayList[i].type == "brand") {
						filterHierarcchy.push(hierarchyArrayList[i].value);
					} else if (hierarchyArrayList[i].selected == "Mixed" && hierarchyArrayList[i].type == "brand") {
						//filterHierarcchy.push(hierarchyArrayList[i].value);
						for (var j = 0; j < hierarchyArrayList[i].rows.length; j++) {
							if (hierarchyArrayList[i].rows[j].selected == "Checked" && hierarchyArrayList[i].rows[j].type == "category") {
								filterHierarcchy.push(hierarchyArrayList[i].value + "|" + hierarchyArrayList[i].rows[j].value);
							} else if (hierarchyArrayList[i].rows[j].selected == "Mixed" && hierarchyArrayList[i].rows[j].type == "category") {
								//filterHierarcchy.push("|"+ hierarchyArrayList[i].rows[j].value);
								for (var k = 0; k < hierarchyArrayList[i].rows[j].rows.length; k++) {
									if (hierarchyArrayList[i].rows[j].rows[k].selected == "Checked" && hierarchyArrayList[i].rows[j].rows[k].type ==
										"subCategory") {
										filterHierarcchy.push(hierarchyArrayList[i].value + "|" + hierarchyArrayList[i].rows[j].value + "|" + hierarchyArrayList[
												i]
											.rows[
												j].rows[k].value);
									} else if (hierarchyArrayList[i].rows[j].rows[k].selected == "Mixed" && hierarchyArrayList[i].rows[j].rows[k].type ==
										"subCategory") {
										//filterHierarcchy.push("|"+ hierarchyArrayList[i].rows[j].rows[k].value);
										for (var l = 0; l < hierarchyArrayList[i].rows[j].rows[k].rows.length; l++) {
											if (hierarchyArrayList[i].rows[j].rows[k].rows[l].selected == "Checked" && hierarchyArrayList[i].rows[j].rows[k].rows[l]
												.type ==
												"SKU") {
												filterHierarcchy.push(hierarchyArrayList[i].value + "|" + hierarchyArrayList[i].rows[j].value + "|" +
													hierarchyArrayList[
														i]
													.rows[j].rows[k].value + "|" + hierarchyArrayList[i].rows[j].rows[k].rows[l].value);
											}
										}
									} else if (hierarchyArrayList[i].rows[j].rows[k].selected == "Checked" && hierarchyArrayList[i].rows[j].rows[k].type ==
										"SKU") {
										filterHierarcchy.push(hierarchyArrayList[i].value + "|" + hierarchyArrayList[i].rows[j].value + "||" + hierarchyArrayList[
												i]
											.rows[j].rows[k].value);
									}
								}
							} else if (hierarchyArrayList[i].rows[j].selected == "Checked" && hierarchyArrayList[i].rows[j].type == "subCategory") {
								filterHierarcchy.push(hierarchyArrayList[i].value + "||" + hierarchyArrayList[i].rows[j].value);
							} else if (hierarchyArrayList[i].rows[j].selected == "Mixed" && hierarchyArrayList[i].rows[j].type == "subCategory") {
								for (var m = 0; m < hierarchyArrayList[i].rows[j].rows.length; m++) {
									if (hierarchyArrayList[i].rows[j].row[m].selected == "Checked" && hierarchyArrayList[i].rows[j].row[m].type == "SKU") {
										filterHierarcchy.push(hierarchyArrayList[i].value + "||" + hierarchyArrayList[i].rows[j].value + "|" + hierarchyArrayList[
												i]
											.rows[j].row[m].value);
									}
								}
							} else if (hierarchyArrayList[i].rows[j].selected == "Checked" && hierarchyArrayList[i].rows[j].type == "SKU") {
								filterHierarcchy.push(hierarchyArrayList[i].value + "|||" + hierarchyArrayList[i].rows[j].value);
							}
						}

					}
				}
				if (filterHierarcchy.length > 0) {
					if (filterHierarcchy.length == "1") {
						var filterHData = filterHierarcchy.toString();
						var singleHierarchyData = [new sap.ui.model.Filter("Hierarchy", sap.ui.model.FilterOperator.EQ, filterHData)];
						this.oDataOperations.readOperation("/FirstShipDateSet", singleHierarchyData, orderSummaryCommonInfo, this._oModel, "",
							"",
							"",
							"",
							"", "X", "", false, "", "FirstShipDateSet");
						$("#__xmlview1--orderSummaryCommonInfo").css("visibility", "visible");
						var layoutData = sap.ui.getCore().byId("__xmlview1--orderSummaryCommonInfo").getModel().getData().FirstShipDateSet[0];
						this.setBrandInfoValues(layoutData);
						if (sap.ui.Device.system.phone) {
							$('#__xmlview1--orderSummaryCommonInfo').removeClass('displayBlockInPhn');
							this.brandwise = '';
							$('#__xmlview1--orderSummaryCommonInfo').addClass('displayHeaderInfo');
							this.setDynamicTableRowCount();
						}
					} else if (filterHierarcchy.length == "0" || filterHierarcchy.length > "1") {
						$("#__xmlview1--orderSummaryCommonInfo").css("visibility", "hidden");
						if (sap.ui.Device.system.phone) {
							this.brandwise = 'X';
							$('#__xmlview1--orderSummaryCommonInfo').removeClass('displayHeaderInfo');
							$('#__xmlview1--orderSummaryCommonInfo').addClass('displayBlockInPhn');
							this.setDynamicTableRowCount();
						}
					}
					var hierarchyFilter = filterHierarcchy.toString();
					console.log(filterHierarcchy, "filterHierarcchy");
					var brandFilterData = new sap.ui.model.Filter("Hierarchy", sap.ui.model.FilterOperator.EQ, hierarchyFilter);
					this.globalFiltersArr.push(brandFilterData);
				} else {
					if (sap.ui.Device.system.phone) {
						this.brandwise = 'X';
						$('#__xmlview1--orderSummaryCommonInfo').removeClass('displayHeaderInfo');
						$('#__xmlview1--orderSummaryCommonInfo').addClass('displayBlockInPhn');
						this.setDynamicTableRowCount();
					}
				}
			}

			//
		},
		setBrandInfoValues: function (layoutData) {
			if (layoutData) {
				if (layoutData.Zgangk) {
					sap.ui.getCore().byId("__xmlview1--shipPort").setText(layoutData.Zgangk);
				} else {
					sap.ui.getCore().byId("__xmlview1--shipPort").setText("-");
				}
				if (layoutData.Zmoq) {
					sap.ui.getCore().byId("__xmlview1--prodMoq").setText(layoutData.Zmoq);
				} else {
					sap.ui.getCore().byId("__xmlview1--prodMoq").setText("-");
				}
				var formattedShipdate = this.formatDateValue(layoutData.ShipDate);
				if (formattedShipdate) {
					sap.ui.getCore().byId("__xmlview1--firstShipDate").setText(formattedShipdate);
				} else {
					sap.ui.getCore().byId("__xmlview1--firstShipDate").setText("-");
				}
			} else {
				sap.ui.getCore().byId("__xmlview1--shipPort").setText("-");
				sap.ui.getCore().byId("__xmlview1--prodMoq").setText("-");

				sap.ui.getCore().byId("__xmlview1--firstShipDate").setText("-");
			}
		},
		resetVar: function () {
			this.customerArr = [];
			this.salesPersonArr = [];
			this._filterYear = "";
			this.orderListArr = [];
			this._customerFilterKey = "";
			this.salesPersonFilterKey = "";
			this.orderTypeFilterKey = "";
			this.globalFiltersArr = [];
		},
		getCountrySelections: function () {
			var countryTreeData = sap.ui.getCore().byId("regionTreeTable").getModel().getData().RegionCountryTreeSet;
			countryTreeData = countryTreeData.rows === undefined ? countryTreeData : countryTreeData.rows;
			var continentArr = [];
			var countryArr = [];
			for (var i in countryTreeData) {
				if (countryTreeData[i].selected === "Checked") {
					continentArr.push(countryTreeData[i].value);
				} else if (countryTreeData[i].selected === "Mixed") {
					var childArr = countryTreeData[i].rows;
					for (var j in childArr) {
						if (childArr[j].selected === "Checked") {
							countryArr.push(childArr[j].value);
						}
					}
				}
			}
			if (countryArr.length !== 0) {
				var country = countryArr.toString();
				country = new sap.ui.model.Filter("Country", sap.ui.model.FilterOperator.EQ, country);
				this.globalFiltersArr.push(country);
			}
			if (continentArr.length !== 0) {
				var continent = continentArr.toString();
				continent = new sap.ui.model.Filter("SalesArea", sap.ui.model.FilterOperator.EQ, continent);
				this.globalFiltersArr.push(continent);
			}
		},
		//advanced search 

		handleSuggestSalesOrderNo: function (oEvent) {
			var modelHandle = sap.ui.getCore().getModel();
			var skip = 0;
			var top = 50;
			var salesOrderNoId = sap.ui.getCore().byId("salesOrderNum");
			var sTerm = [];
			sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			var SFilters = [];

			if (sTerm.length > 4) {
				aFilters.push(new Filter("SearchNumber", sap.ui.model.FilterOperator.EQ, sTerm));
				SFilters.push(new Filter("SearchNumber", sap.ui.model.FilterOperator.StartsWith, sTerm));
				this.oDataOperations.readOperation("/AdvanceSearchSet", aFilters, salesOrderNoId, modelHandle, skip, top, "", "", "", "", "",
					"", "", "AdvanceSearchSet","X");
			}
			oEvent.getSource().getBinding("suggestionItems").filter(SFilters);
		},
		handleSuggestCustomerPoNo: function (oEvent) {
			var modelHandle = sap.ui.getCore().getModel();
			var skip = 0;
			var top = 50;
			var customPoId = sap.ui.getCore().byId("customerPoNo");
			var sTerm = [];
			sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			var SFilters = [];

			if (sTerm.length > 4) {
				aFilters.push(new Filter("SearchNumber", sap.ui.model.FilterOperator.EQ, sTerm));
				aFilters.push(new Filter("SearchField", sap.ui.model.FilterOperator.EQ, "CUST_PO"));
				SFilters.push(new Filter("SearchNumber", sap.ui.model.FilterOperator.StartsWith, sTerm));
				this.oDataOperations.readOperation("/AdvanceSearchSet", aFilters, customPoId, modelHandle, skip, top, "", "", "", "", "", "",
					"", "AdvanceSearchSet","X");
			}
			oEvent.getSource().getBinding("suggestionItems").filter(SFilters);
		},
		handleSuggestOldMaterialId: function (oEvent) {
			var modelHandle = sap.ui.getCore().getModel();
			var skip = 0;
			var top = 50;
			var oldMaterialId = sap.ui.getCore().byId("OldMaterialId");
			var sTerm = [];
			sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			var SFilters = [];

			if (sTerm.length > 4) {
				aFilters.push(new Filter("SearchNumber", sap.ui.model.FilterOperator.EQ, sTerm));
				aFilters.push(new Filter("SearchField", sap.ui.model.FilterOperator.EQ, "OLD_MAT"));
				SFilters.push(new Filter("SearchNumber", sap.ui.model.FilterOperator.StartsWith, sTerm));
				this.oDataOperations.readOperation("/AdvanceSearchSet", aFilters, oldMaterialId, modelHandle, skip, top, "", "", "", "", "",
					"", "", "AdvanceSearchSet", "X");
			}
			oEvent.getSource().getBinding("suggestionItems").filter(SFilters);
		},
		onOrderStatusChange: function () {
			console.log(evt);
		},
		onOrderChange: function (evt) {
			console.log(evt);
			stopReading = false;
			skip = 50;
			var selectedOrder = evt.getSource().getSelectedKey();
			var orderStatus = new sap.ui.model.Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, selectedOrder);
			var detailViewTable = this.getView().byId("detailTable");
			var salesOrderVal = sap.ui.getCore().byId("salesOrderNum").getValue();
			var custPoNum = sap.ui.getCore().byId("customerPoNo").getValue();
			if (salesOrderVal || custPoNum) {
				this.globalFiltersArr = [];
				if (salesOrderVal) {
					var salesOrder = new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, salesOrderVal);
					this.globalFiltersArr.push(salesOrder);
				}
				if (custPoNum) {
					var customerPoValue = new sap.ui.model.Filter("Bstnk", sap.ui.model.FilterOperator.EQ, custPoNum);
					this.globalFiltersArr.push(customerPoValue);
				}
				if (orderStatus) {
					this.globalFiltersArr.push(orderStatus);
				}
				var count = this.oDataOperations.readOperation("/DetailViewSet", this.globalFiltersArr, detailViewTable, this.oModel, 0, 50, "",
					"", "", "", "",
					true, "Table", "DetailViewSet");
				this.setPaginationCountValue(count);
			} else {

				if (this.globalFiltersArr.length === 0) {
					this.globalFiltersArr.push(orderStatus);
					if (salesOrder) {
						this.globalFiltersArr.push(salesOrder);
					}
				} else {
					for (var i in this.globalFiltersArr) {
						if (this.globalFiltersArr[i].sPath === "OrderStatus") {
							this.globalFiltersArr.splice(i, 1);
						} else {
							this.globalFiltersArr.push(orderStatus);
							if (salesOrder) {
								this.globalFiltersArr.push(salesOrder);
							}
						}

					}
				}
			}
			if (!salesOrderVal) {
				var orderChange = "X";
				this.handleConfirm(orderChange);
			}
			pageNo = 1;
			skipValForMbl = 0;

		},
		applySearch: function (oEvent) {
			if (sap.ui.Device.system.phone === false) {
				sap.ui.getCore().byId("__xmlview1--orderStatusBtn").setSelectedButton("");
			}

			stopReading = false;
			skip = 50;
			var detailViewTable = this.getView().byId("detailTable");
			var salesOrderNo = sap.ui.getCore().byId("salesOrderNum").getTokens();
			var customerPoNo = sap.ui.getCore().byId("customerPoNo").getTokens();
			var oldMaterialNo = sap.ui.getCore().byId("OldMaterialId").getTokens();
			this.oModel = this.getView().getModel();
			var aFilters = [];
			// var salesOrgYear = new sap.ui.model.Filter("SoYear", sap.ui.model.FilterOperator.EQ, "2018");
			// aFilters.push(salesOrgYear);
			if (salesOrderNo.length > 0) {
				var saleOrder="";
				for(var i in salesOrderNo){
					saleOrder += salesOrderNo[i].getText();
					if(i != salesOrderNo.length-1)
						saleOrder += ",";
				}
				var salesOrderVal = new sap.ui.model.Filter("VbelnStr", sap.ui.model.FilterOperator.EQ, saleOrder);
				aFilters.push(salesOrderVal);
			}
			if (customerPoNo.length > 0) {
				var customerPo="";
				for(var j in customerPoNo){
					customerPo += customerPoNo[j].getText();
					if(j != customerPoNo.length-1)
						customerPo += ",";
				}
				var customerPoValue = new sap.ui.model.Filter("BstnkStr", sap.ui.model.FilterOperator.EQ, customerPo);
				aFilters.push(customerPoValue);
			}
			if (oldMaterialNo.length > 0) {
				var oldMaterial="";
				for(var k in oldMaterialNo){
					oldMaterial += oldMaterialNo[k].getText();
					if(k != oldMaterialNo.length-1)
						oldMaterial += ",";
				}
				var oldMaterialValue = new sap.ui.model.Filter("BismtStr", sap.ui.model.FilterOperator.EQ, oldMaterial);
				aFilters.push(oldMaterialValue);
			}
			
			//Date Filter 
			
			
			
			// var salesDistrict = new sap.ui.model.Filter("Bzirk", sap.ui.model.FilterOperator.EQ, "12");
			// aFilters.push(salesDistrict);
			var count = this.oDataOperations.readOperation("/DetailViewSet", aFilters, detailViewTable, this.oModel, 0, 50, "", "", "",
				"", "",
				true, "Table", "DetailViewSet");
			this.setPaginationCountValue(count);
			this._advancedSearchDialog.close();
			this.resetListModel();
			this.resetTreeTableValues();
			if (sap.ui.Device.system.phone === true) {
				this.searchStatusInd = true;
			}

			$("#__xmlview1--filterBtn .sapMBtnInner ").removeClass("FillterApply");
			$("#__xmlview1--filterBtn .sapMBtnIcon ").removeClass("filterIcon");
			// sap.ui.getCore().byId("salesOrderNum").setValue("");
			// sap.ui.getCore().byId("customerPoNo").setValue("");
			
			
		},
		onFilterItemsClicked: function (evt) {
			if (evt.getParameters().parentFilterItem.sId === "idBrandFilterItem" || evt.getParameters().parentFilterItem.sId ===
				"idRegionFilterItem") {
				sap.ui.getCore().byId("filterDlg-page2").setEnableScrolling(false);
			} else {
				sap.ui.getCore().byId("filterDlg-page2").setEnableScrolling(true);
			}
			this.filterFlag = "X";
		},
		triggerPagination: function (sEntity, aFilters, controlId, model, entityName) {
			//console.log("inside pagination.");
			// $.loader.open();
			var oController = sap.ui.getCore().byId("__xmlview0").getController();
			sap.ui.getCore().byId("BusyDialog").open();
			// console.log("pagination triggered");

			var sURL, count;
			if (!sURL) {
				if (!skip && !top) {
					sURL = sEntity;
				} else {
					if(aSorters) {
						var property = aSorters[0].Property; 
						var sortOrder = aSorters[0].SortOrder;                      
						sURL = sEntity + "?$skip=" + skip + "&" + "$top=" + top  + "&" + "$orderby=" + property + " " + sortOrder ;
					}
                	else {
						sURL = sEntity + "?$skip=" + skip + "&" + "$top=" + top ;
                	}
				}
			}
			var oModel = sap.ui.getCore().getModel();
			var mParameters = {
				async: true,
				filters: aFilters,
				success: jQuery.proxy(function (oData, oResponse) {
					/*	var oList = sap.ui.getCore().byId("__xmlview0--list");*/
					if (oData.__count !== undefined) {
						count = oData.__count;
					}
					skip += 50;
					if (oData.results.length < top) {
						stopReading = true;
					}
					for (var val in oData.results) {
						oData.results[val].VbelnNum = Number(oData.results[val].Vbeln);
						oData.results[val].PackQtySort = Number(oData.results[val].PackQty);
						oData.results[val].KwmengSort = Number(oData.results[val].Kwmeng);
						oData.results[val].NetprSort = parseFloat(oData.results[val].Netpr);
						oData.results[val].TotalAmtSort = parseFloat(oData.results[val].TotalAmt);
						oData.results[val].PoNumberSort = Number(oData.results[val].PoNumber);

					}
					var oDataJSONModel = new sap.ui.model.json.JSONModel();
					var obj = {};
					var len = oData.results.length;
					var data = controlId.getModel().getData()[entityName];
					for (var i = 0; i < len; i++) {
						data.push(oData.results[i]);
					}
					obj[entityName] = data;
					oDataJSONModel.setData(obj);
					controlId.setModel(oDataJSONModel);
					/**/
					flagforPagination = 0;
					// sap.ui.core.BusyIndicator.hide();
					// sap.ui.getCore().byId("__xmlview1--detailTable").setBusy(false);
					// $.loader.close();
					this.setPaginationCountValue(count);
					sap.ui.getCore().byId("BusyDialog").close();
				}, this),
				error: jQuery.proxy(function (oData, oResponse) {
					// $.loader.close();
					var oErrorResponse = jQuery.parseJSON(oData.response.body);
					// sap.ui.getCore().byId("__xmlview1--detailTable").setBusy(false);
					sap.ui.getCore().byId("BusyDialog").close();
					sap.ui.core.BusyIndicator.hide();
					console.log(oErrorResponse.error.message.value);

					oController.messageBoxError(oErrorResponse.error.message.value);
				}, this)
			};
			oModel.read(sURL, mParameters);

			// if (count) {
			// 	return count;
			// }
		},
		resetTreeTableValues: function () {
			var countryObj = {},
				hierarchyObj = {};
			var countryTreeData = sap.ui.getCore().byId("regionTreeTable").getModel().getData().RegionCountryTreeSet;
			countryTreeData = countryTreeData.rows === undefined ? countryTreeData : countryTreeData.rows;
			var countryTree = sap.ui.getCore().byId("regionTreeTable");
			var hierarchyTree = sap.ui.getCore().byId("hierarchyTable");
			for (var i in countryTreeData) {
				countryTreeData[i].selected = "Unchecked";
				for (var j in countryTreeData[i].rows) {
					countryTreeData[i].rows[j].selected = "Unchecked";
				}
			}
			if (hierarchyArrayList) {
				for (i = 0; i < hierarchyArrayList.length; i++) {
					hierarchyArrayList[i].selected = "Unchecked";
					for (j = 0; j < hierarchyArrayList[i].rows.length; j++) {
						hierarchyArrayList[i].rows[j].selected = "Unchecked";
						for (var k = 0; k < hierarchyArrayList[i].rows[j].rows.length; k++) {
							hierarchyArrayList[i].rows[j].rows[k].selected = "Unchecked";
							for (var l = 0; l < hierarchyArrayList[i].rows[j].rows[k].rows.length; l++) {
								hierarchyArrayList[i].rows[j].rows[k].rows[l].selected = "Unchecked";
							}
						}
					}
				}
			}
			var countryJSONModel = new sap.ui.model.json.JSONModel();
			countryJSONModel.setSizeLimit(10000);
			var hierarchyJSONModel = new sap.ui.model.json.JSONModel();
			hierarchyJSONModel.setSizeLimit(10000);
			countryObj["RegionCountryTreeSet"] = countryTreeData;
			countryJSONModel.setData(countryObj);
			countryTree.setModel(countryJSONModel);
			countryTree.bindRows("/RegionCountryTreeSet");
			if (hierarchyArrayList) {
				// HierarchyTreeSet
				hierarchyObj["HierarchyTreeSet"] = hierarchyArrayList;
				hierarchyJSONModel.setData(hierarchyObj);
				hierarchyTree.setModel(hierarchyJSONModel);
				hierarchyTree.bindRows("/HierarchyTreeSet");
			}
			sap.ui.getCore().byId("BrandSearch").setValue("");

			sap.ui.getCore().byId("RegionSearch").setValue("");
		},

		onReset: function () {
			sap.ui.core.BusyIndicator.show();
			sap.m.MessageToast.show("Data Resetting.", {
				at: "center center"
			});
			stopReading = false;
			skip = 50;

			if (sap.ui.Device.system.phone === true) {
				sap.ui.getCore().byId("__xmlview1--detailTable").setFixedColumnCount(0);
			} else {
				sap.ui.getCore().byId("__xmlview1--detailTable").setFixedColumnCount(4);
			}
			var dtlTable = sap.ui.getCore().byId("__xmlview1--detailTable");
			var oControl = sap.ui.getCore().byId("__xmlview0").getController();
			sap.ui.getCore().byId("salesOrderNum").setValue("");
			sap.ui.getCore().byId("customerPoNo").setValue("");
			if (this.customerArr.length !== 0) {
				sap.ui.getCore().byId("idCustomerList").removeSelections(true);
			}
			if (this.salesPersonArr.length !== 0) {
				sap.ui.getCore().byId("idSalesPersonList").removeSelections(true);
			}
			if (this.orderListArr !== 0) {
				sap.ui.getCore().byId("idOrderList").removeSelections(true);
			}

			var currentYear = sap.ui.getCore().byId("idYearList").getItems()[0];
			sap.ui.getCore().byId("idYearList").setSelectedItem(currentYear);
			sap.ui.getCore().byId("__xmlview1--orderStatusBtn").setSelectedButton("");
			this.customerArr = [];
			this.salesPersonArr = [];
			this.orderListArr = [];
			this.resetVar();

			this.loadDetailTableValues();
			sap.ui.core.BusyIndicator.hide();
			var tblscrl = dtlTable.$().find(".sapUiScrollBar > div:eq(0)");
			if (tblscrl) {
				tblscrl.scrollTop(0);
			}
			$("#__xmlview1--filterBtn .sapMBtnInner ").removeClass("FillterApply");
			$("#__xmlview1--filterBtn .sapMBtnIcon ").removeClass("filterIcon");
			$("#__xmlview1--orderSummaryCommonInfo").css("visibility", "hidden");
			if (sap.ui.Device.system.phone) {
				$("#__xmlview1--filterBtnHeader-img").css("color", "#fff");
			}
			if (sap.ui.Device.system.phone) {
				this.brandwise = 'X';
			}

			$('#__xmlview1--orderSummaryCommonInfo').removeClass('displayHeaderInfo');
			$('#__xmlview1--orderSummaryCommonInfo').addClass('displayBlockInPhn');

			var scope = this;
			setTimeout(function () {
				scope.clearFilter();
			}, 1000);
			pageNo = 1;
			skipValForMbl = 0;
			this.resetTreeTableValues();
			this.resetListModel();
			this.searchStatusInd = false;
			//reset search field value 
			sap.ui.getCore().byId("BrandSearch").setValue("");
			sap.ui.getCore().byId("customerSearch").setValue("");
			sap.ui.getCore().byId("SalesPersonSearch").setValue("");
			sap.ui.getCore().byId("RegionSearch").setValue("");
			sap.ui.getCore().byId("OrderSearch").setValue("");
			setTimeout(function () {

				scope.setDynamicTableRowCount();
			}, 500);

		},
		resetListModel: function () {
			var customerObj = {},
				salesPersonObj = {},
				orderTypeObj = {};
			var customerJSONModel = new sap.ui.model.json.JSONModel();
			customerJSONModel.setSizeLimit(10000);
			var salesPersonJSONModel = new sap.ui.model.json.JSONModel();
			salesPersonJSONModel.setSizeLimit(10000);
			var orderTypeJsonModel = new sap.ui.model.json.JSONModel();
			orderTypeJsonModel.setSizeLimit(10000);
			customerObj["CustomerSet"] = this.customerArrClone;
			customerJSONModel.setData(customerObj);
			sap.ui.getCore().byId("idCustomerList").setModel(customerJSONModel);

			salesPersonObj["SalesPersonSet"] = this.salesPersonArrClone;
			salesPersonJSONModel.setData(salesPersonObj);
			sap.ui.getCore().byId("idSalesPersonList").setModel(salesPersonJSONModel);

			orderTypeObj["SalesOrderTypeSet"] = this.orderListArrClone;
			orderTypeJsonModel.setData(orderTypeObj);
			sap.ui.getCore().byId("idOrderList").setModel(orderTypeJsonModel);
			var currentYear = sap.ui.getCore().byId("idYearList").getItems()[0];
			sap.ui.getCore().byId("idYearList").setSelectedItem(currentYear);
			var orderStatusListItem = sap.ui.getCore().byId("idOrderStatusList").getItems()[0];
			sap.ui.getCore().byId("idOrderStatusList").setSelectedItem(orderStatusListItem);

			sap.ui.getCore().byId("OrderSearch").setValue("");
			sap.ui.getCore().byId("customerSearch").setValue("");
			sap.ui.getCore().byId("SalesPersonSearch").setValue("");
		},
		// onRefresh: function () {
		// 	sap.ui.core.BusyIndicator.show();
		// 	this.handleConfirm();
		// 	this.applySearch();
		// 	sap.ui.core.BusyIndicator.hide();
		// 	// this.loadDetailTableValues();

		// },

		onFilterListSearch: function (evt) {
			var listFilterObj, clearObj, entityName;
			var listItems;
			var listObj = {
				"CustomerList": "idCustomerList",
				"SalesPersonList": "idSalesPersonList",
				"OrderList": "idOrderList"
			};
			var entityObj = {
				"CustomerList": "CustomerSet",
				"SalesPersonList": "SalesPersonSet",
				"OrderList": "SalesOrderTypeSet"
			};
			var objPresenceInd = false;
			console.log(this.customerArr, "customerArr")
			var searchText = evt.getParameters().query;
			var listName = evt.getSource().data("List");
			sap.ui.getCore().byId(listObj[listName]).setBusy(true);
			var listClone = this.getListClone(listName);
			var listGlobalArr = this.getListGlobalArr(listName);
			var listId = sap.ui.getCore().byId(listObj[listName]);
			var oDataJSONModel = new sap.ui.model.json.JSONModel();
			oDataJSONModel.setSizeLimit(10000);
			var searchArr = [];
			if (searchText !== "") {
				// var listData = sap.ui.getCore().byId(listObj[listName]).getModel().getData().sEntity;
				var listObjKeys = Object.keys(listClone[0]);
				var noOfObjKeys = listObjKeys.length;
				for (var k in listObjKeys) {
					if (listObjKeys[k] == "__metadata") {
						listObjKeys.splice(k, 1);
					}
				}
				for (var i in listClone) {
					for (var j in listObjKeys) {
						// console.log(listData[i][listObjKeys[0]]);

						if ((listClone[i][listObjKeys[j]].toLocaleLowerCase()).indexOf(searchText.toLocaleLowerCase()) > -1) {
							searchArr.push(listClone[i]);
						}
					}
				}

				for (var p = 0; p < listGlobalArr.length; p++) {
					for (var n = 0; n < listClone.length; n++) {
						for (var m = 0; m < listObjKeys.length; m++) {
							if (listGlobalArr[p] === listClone[n][listObjKeys[m]]) {
								if (searchArr.length === 0) {
									searchArr.push(listClone[n]);
								} else {
									for (var t in searchArr) {
										if (searchArr[t][listObjKeys[m]] === listClone[n][listObjKeys[m]]) {

											objPresenceInd = true;
										}
									}
									if (objPresenceInd === false) {
										searchArr.push(listClone[n]);
									}
								}
							}
						}

					}
				}
				entityName = entityObj[listName];
				listFilterObj = {};
				listFilterObj[entityName] = searchArr;
				oDataJSONModel.setData(listFilterObj);
				listId.setModel(oDataJSONModel);
				listItems = listId.getItems(listName);

				for (var o in listGlobalArr) {
					for (var l in listItems) {
						if (listItems[l].data("key") === listGlobalArr[o]) {
							listId.setSelectedItem(listItems[l]);
						}
					}
				}

				sap.ui.getCore().byId(listObj[listName]).setBusy(false);
			} else if (searchText === "") {
				clearObj = {};
				entityName = entityObj[listName];
				clearObj[entityName] = listClone;
				oDataJSONModel.setData(clearObj);
				listId.setModel(oDataJSONModel);
				listItems = listId.getItems();
				for (o in listGlobalArr) {
					for (l in listItems) {
						if (listItems[l].data("key") === listGlobalArr[o]) {
							listId.setSelectedItem(listItems[l]);
						}
					}
				}
				sap.ui.getCore().byId(listObj[listName]).setBusy(false);
			}
		},
		getListClone: function (listName) {
			if (listName === "CustomerList") {
				return this.customerArrClone;
			} else if (listName === "SalesPersonList") {
				return this.salesPersonArrClone;
			} else {
				return this.orderListArrClone;

			}
		},
		getListGlobalArr: function (listName) {

			if (listName === "CustomerList") {
				return this.customerArr;
			} else if (listName === "SalesPersonList") {
				return this.salesPersonArr;
			} else {
				return this.orderListArr;

			}
		},
		onDownload: function () {
			var oTable = this.getView().byId("detailTable");
			// var oTable = sap.ui.getCore().byId("__xmlview0--hybrisReport");
			sap.ui.getCore().byId("BusyDialog").open();
			sap.m.MessageToast.show("Downloading....", {
				at: "center center"
			});
			// $.loader.open();
			var oExport, path;
			var viewId = sap.ui.getCore().byId("__xmlview0");
			var aFilters = [];
			var oModel = sap.ui.getCore().getModel();
			var oControl = sap.ui.getCore().byId("__xmlview0").getController();
			var selectedYear = sap.ui.getCore().byId("idYearList").getSelectedItem().getTitle();
			var oDataJSONModel;
			var salesOrgYear = new sap.ui.model.Filter("SoYear", sap.ui.model.FilterOperator.EQ, selectedYear);
			aFilters.push(salesOrgYear);

			var mParameters = {
				async: false,
				filters: aFilters,
				success: jQuery.proxy(function (oData, oResponse) {

					oDataJSONModel = new sap.ui.model.json.JSONModel(oData.results);
					oDataJSONModel.setSizeLimit(10000);
					for (var val in oData.results) {
						oData.results[val].VbelnNum = Number(oData.results[val].Vbeln);
						oData.results[val].PackQtySort = Number(oData.results[val].PackQty);
						oData.results[val].KwmengSort = Number(oData.results[val].Kwmeng);
						oData.results[val].NetprSort = parseFloat(oData.results[val].Netpr);
						oData.results[val].TotalAmtSort = parseFloat(oData.results[val].TotalAmt);
						oData.results[val].PoNumberSort = Number(oData.results[val].PoNumber);

					}
					oDataJSONModel.setData({
						DetailViewSet: oData.results
					});
					viewId.setModel(oDataJSONModel);
					console.log(oDataJSONModel);

				}, this),
				error: jQuery.proxy(function (oData, oResponse) {

					var oErrorResponse = jQuery.parseJSON(oData.response.body);
					console.log(oErrorResponse.error.message.value);
					sap.ui.core.BusyIndicator.hide();
					oController.messageBoxError(oErrorResponse.error.message.value);
				}, this)
			};

			oModel.read("/DetailViewSet", mParameters);
			oExport = new sap.ui.core.util.Export({
				exportType: new sap.ui.core.util.ExportTypeCSV({
					separatorChar: ","
				}),
				models: viewId.getModel(),
				rows: {
					path: "/DetailViewSet"
				},
				columns: [{
						name: "Order Status",
						template: {
							content: "{OrderStatus}"
						}
					}, {
						name: "Sales Order no",
						template: {
							content: "{Vbeln}"
						}
					}, {
						name: "Old Material Id",
						template: {
							content: "{parts: [{path:'Bismt'},{path:'VbelnNum'}],formatter : 'formatter.showBarOnNoData'}"
						}
					}, {
						name: "Case pack",
						template: {
							content: "{parts: [{path:'PackQtySort'},{path:'VbelnNum'}],formatter : 'formatter.showBarOnNoData'}"
						}
					}, {
						name: "Created Date",
						template: {
							content: "{parts: [{path:'Erdat'},{path:'VbelnNum'}],formatter : 'formatter.formatDateValue'}"
						}
					}, {
						name: "Sold To Party",
						template: {
							content: "{parts: [{path:'Spname'},{path:'VbelnNum'}],formatter : 'formatter.showBarOnNoData'}"
						}
					}, {
						name: "Sold To Party Country",
						template: {
							content: "{parts: [{path:'Spctryname'},{path:'VbelnNum'}],formatter : 'formatter.showBarOnNoData'}"
						}
					}, {
						name: "Ship To Party",
						template: {
							content: "{parts: [{path:'Shname'},{path:'VbelnNum'}],formatter : 'formatter.showBarOnNoData'}"
						}
					}, {
						name: "Ship To Party Country",
						template: {
							content: "{parts: [{path:'Shctryname'},{path:'VbelnNum'}],formatter : 'formatter.showBarOnNoData'}"
						}
					}, {
						name: "Qty (EA)",
						template: {
							content: "{parts: [{path:'KwmengSort'},{path:'VbelnNum'}],formatter : 'formatter.formatQuantityvalue'}"
						}
					}, {
						name: "Unit Price $",
						template: {
							content: "{parts: [{path:'NetprSort'},{path:'VbelnNum'}],formatter : 'formatter.showBarOnNoData'}"
						}
					}, {
						name: "Total Amount $",
						template: {
							content: "{parts: [{path:'TotalAmtSort'},{path:'VbelnNum'}],formatter : 'formatter.showBarOnNoData'}"
						}
					}, {
						name: "Po Number",
						template: {
							content: "{parts: [{path:'PoNumberSort'},{path:'VbelnNum'}],formatter : 'formatter.showBarOnNoData'}"
						}
					}, {
						name: "Customer Ship date",
						template: {
							content: "{path:'Vdatu',formatter:'formatter.formatDateValue'}"
						}
					}, {
						name: "Expected CRD",
						template: {
							content: "{path:'Eindt',formatter:'formatter.formatDateValue'}"
						}
					}, {
						name: "Actual Factory Delivery Date",
						template: {
							content: "{path:'ActualShipment',formatter:'formatter.formatDateValue'}"
						}
					}, {
						name: "Billed Date",
						template: {
							content: "{path:'BilledDate',formatter:'formatter.formatDateValue'}"
						}
					}, {
						name: "Expected Date In Stores",
						template: {
							content: "{path:'ExpctdInStore',formatter:'formatter.formatDateValue'}"
						}
					}, {
						name: "Payment Received Date",
						template: {
							content: "{path:'PaymentDate',formatter:'formatter.formatDateValue'}"
						}
					}, {
						name: "Sales Name",
						template: {
							content: "{parts: [{path:'SalesPerson'},{path:'VbelnNum'}],formatter : 'formatter.showBarOnNoData'}"
						}
					},

				]
			});
			oExport.saveFile("OrderSummary");
			sap.ui.getCore().byId("BusyDialog").close();
			// $.loader.close();
		},
		onRegionTreeSerarch: function (evt) {
			var searchText = evt.getParameters().query;
			var regionTable = sap.ui.getCore().byId("regionTreeTable");
			if (searchText !== "") {

				regionTable.getBinding().filter(new sap.ui.model.Filter("description", sap.ui.model.FilterOperator.Contains,
					searchText));
				regionTable.expandToLevel(3);
			} else if (searchText === "") {

				regionTable.getBinding().filter(new sap.ui.model.Filter("description", sap.ui.model.FilterOperator.Contains,
					searchText));
				regionTable.collapseAll();
			}
		},
		onBrandCatogorySearch: function (evt) {
			var searchText = evt.getParameters().query;
			var hierarchyTable = sap.ui.getCore().byId("hierarchyTable");
			if (searchText !== "") {

				hierarchyTable.getBinding().filter(new sap.ui.model.Filter("description", sap.ui.model.FilterOperator.Contains,
					searchText));
				hierarchyTable.expandToLevel(6);
			} else if (searchText === "") {
				hierarchyTable.getBinding().filter(new sap.ui.model.Filter("description", sap.ui.model.FilterOperator.Contains,
					searchText));
				hierarchyTable.collapseAll();
			}

		},
		handleResetFilters: function (evt) {
			console.log(evt);
			var listObj = {
				"CustomerList": "idCustomerList",
				"SalesPersonList": "idSalesPersonList",
				"OrderList": "idOrderList"
			};
			var entityObj = {
				"CustomerList": "CustomerSet",
				"SalesPersonList": "SalesPersonSet",
				"OrderList": "SalesOrderTypeSet"
			};
			var oDataJSONModel = new sap.ui.model.json.JSONModel();
			oDataJSONModel.setSizeLimit(10000);
			if (evt.getSource()._oContentItem) {
				var filterList = evt.getSource()._oContentItem.getCustomControl().getContent()[1].sId;
			}
			var contentItem = evt.getSource()._oContentItem;
			if (contentItem === undefined) {
				this.resetListModel();
				this.resetTreeTableValues();
				var currentYear = sap.ui.getCore().byId("idYearList").getItems()[0];
				sap.ui.getCore().byId("idYearList").setSelectedItem(currentYear);
				//reset search field value 
				sap.ui.getCore().byId("BrandSearch").setValue("");
				sap.ui.getCore().byId("customerSearch").setValue("");
				sap.ui.getCore().byId("SalesPersonSearch").setValue("");
				sap.ui.getCore().byId("RegionSearch").setValue("");
				sap.ui.getCore().byId("OrderSearch").setValue("");
			} else if (contentItem.sId === "idRegionFilterItem") {
				var countryTreeData = sap.ui.getCore().byId("regionTreeTable").getModel().getData().RegionCountryTreeSet;
				countryTreeData = countryTreeData.rows === undefined ? countryTreeData : countryTreeData.rows;
				var treeId = sap.ui.getCore().byId("regionTreeTable");
				for (var i in countryTreeData) {
					countryTreeData[i].selected = "Unchecked";
					for (var j in countryTreeData[i].rows) {
						countryTreeData[i].rows[j].selected = "Unchecked";
					}
				}
				var countryObj = {};
				countryObj["RegionCountryTreeSet"] = countryTreeData;
				oDataJSONModel.setData(countryObj);
				treeId.setModel(oDataJSONModel);
				treeId.bindRows("/RegionCountryTreeSet");
			} else if (contentItem.sId === "idBrandFilterItem") {
				var brandFiltersId = sap.ui.getCore().byId("hierarchyTable");
				for (var i = 0; i < hierarchyArrayList.length; i++) {
					hierarchyArrayList[i].selected = "Unchecked";
					for (var j = 0; j < hierarchyArrayList[i].rows.length; j++) {
						hierarchyArrayList[i].rows[j].selected = "Unchecked";
						for (var k = 0; k < hierarchyArrayList[i].rows[j].rows.length; k++) {
							hierarchyArrayList[i].rows[j].rows[k].selected = "Unchecked";
							for (var l = 0; l < hierarchyArrayList[i].rows[j].rows[k].rows.length; l++) {
								hierarchyArrayList[i].rows[j].rows[k].rows[l].selected = "Unchecked";
							}
						}
					}
				}
				var hierarchyObj = {};
				hierarchyObj["HierarchyTreeSet"] = hierarchyArrayList;
				oDataJSONModel.setData(hierarchyObj);
				brandFiltersId.setModel(oDataJSONModel);
				brandFiltersId.bindRows("/HierarchyTreeSet");
			} else {
				var searchId = evt.getSource()._oContentItem.getCustomControl().getContent()[0].sId;

				var listName = sap.ui.getCore().byId(searchId).data("List");
				if (listName === "YearList") {
					var currentYr = sap.ui.getCore().byId("idYearList").getItems()[0];
					sap.ui.getCore().byId("idYearList").setSelectedItem(currentYr);
				} else {
					var clone = this.getListClone(listName);
					// var globalArr = this.getListGlobalArr(listName);
					if (listName === "CustomerList") {
						this.customerArr = [];
					} else if (listName === "SalesPersonList") {
						this.salesPersonArr = [];
					} else if (listName === "OrderList") {
						this.orderListArr = [];
					}
					var CurrentListObj = {};
					var entityName = entityObj[listName];
					CurrentListObj[entityName] = clone;
					sap.ui.getCore().byId(filterList).removeSelections(true);
					oDataJSONModel.setData(CurrentListObj);
					sap.ui.getCore().byId(filterList).setModel(oDataJSONModel);
				}
			}
			var searchFieldId = evt.getSource()._oContentItem.getCustomControl().getContent()[0].sId;
			sap.ui.getCore().byId(searchFieldId).setValue("");

		},
		formatDateValue: function (oDate) {
			if (oDate) {
				if (typeof oDate === "string") {
					if (oDate.indexOf("/") == -1) {
						return oDate;
					}
					oDate = eval(("new " + oDate).replace(/\//g, ""));
				} else {
					oDate = (_.isDate(oDate)) ? oDate : new Date(oDate);
				}
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					source: {
						pattern: "timestamp"
					},
					pattern: "yyyy.MM.dd"
				});
				var dateval = dateFormat.format(oDate);
				var formattedMonth = this.formatMonthName(dateval);
				return formattedMonth;
			} else {
				return "";
			}
		},
		formatMonthName: function (Date) {
			var Months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			Date = Date.split(".");
			var month = Number(Date[1]) - 1;
			month = Months[month];
			var Year = Date[0];
			var day = Date[2];
			return day + "-" + month + "-" + Year;

		},
		onPrevPagingBtnPress: function () {
			pageNo = pageNo - 1;
			// if (pageNo === 1) {
			// 	sap.ui.getCore().byId("__xmlview1--prevBtn").setEnabled(false);
			// }
			if (this.globalFiltersArr.length === 0) {
				var orderStatusKey;
				var soYear = sap.ui.getCore().byId("idYearList").getSelectedItem().getTitle();
				if (sap.ui.Device.system.phone == false) {
					orderStatusKey = sap.ui.getCore().byId("__xmlview1--orderStatusBtn").getSelectedKey();
				} else {
					var orderStatudTypeId = sap.ui.getCore().byId("idOrderStatusList").getSelectedItem().getId();
					orderStatusKey = sap.ui.getCore().byId(orderStatudTypeId).data("key");
				}
				var salesOrgYear = new sap.ui.model.Filter("SoYear", sap.ui.model.FilterOperator.EQ, soYear);
				this.globalFiltersArr.push(salesOrgYear);
				var orderStatus = new sap.ui.model.Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, orderStatusKey);
				this.globalFiltersArr.push(orderStatus);
			}
			// this.setPageValue(prevPage);
			var detailViewTable = this.getView().byId("detailTable");
			this.triggerPaginationForMobileAndTablet("/DetailViewSet", this.globalFiltersArr, detailViewTable, this._oModel, "DetailViewSet",
				"prevBtn");
		},
		onNextPagingBtnPress: function () {
			pageNo = pageNo + 1;
			// if (skip === 50) {
			// 	skip = 0;

			// }
			if (this.globalFiltersArr.length === 0) {
				var orderStatusKey;
				var soYear = sap.ui.getCore().byId("idYearList").getSelectedItem().getTitle();
				if (sap.ui.Device.system.phone == false) {
					orderStatusKey = sap.ui.getCore().byId("__xmlview1--orderStatusBtn").getSelectedKey();
				} else {
					var orderStatudTypeId = sap.ui.getCore().byId("idOrderStatusList").getSelectedItem().getId();
					orderStatusKey = sap.ui.getCore().byId(orderStatudTypeId).data("key");
				}
				var salesOrgYear = new sap.ui.model.Filter("SoYear", sap.ui.model.FilterOperator.EQ, soYear);
				this.globalFiltersArr.push(salesOrgYear);
				var orderStatus = new sap.ui.model.Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, orderStatusKey);
				this.globalFiltersArr.push(orderStatus);
			}

			var detailViewTable = this.getView().byId("detailTable");
			this.triggerPaginationForMobileAndTablet("/DetailViewSet", this.globalFiltersArr, detailViewTable, this._oModel, "DetailViewSet",
				"nextBtn");
		},
		setPageValue: function (page, count) {
			totalPages = count / 50;
			totalPages = Math.ceil(totalPages);
			if (page) {
				sap.ui.getCore().byId("__xmlview1--pageText").setText(page + " of " + totalPages);
			}
			if (pageNo === 1) {
				sap.ui.getCore().byId("__xmlview1--prevBtn").setEnabled(false);
			}
			if (pageNo > 1) {
				sap.ui.getCore().byId("__xmlview1--prevBtn").setEnabled(true);
				sap.ui.getCore().byId("__xmlview1--nextBtn").setEnabled(true);
			}
			if (pageNo === 1 && totalPages === 1) {
				sap.ui.getCore().byId("__xmlview1--prevBtn").setEnabled(false);
				sap.ui.getCore().byId("__xmlview1--nextBtn").setEnabled(false);
			} else if (pageNo === totalPages) {
				sap.ui.getCore().byId("__xmlview1--prevBtn").setEnabled(true);
				sap.ui.getCore().byId("__xmlview1--nextBtn").setEnabled(false);
			}
			// if (pageNo === totalPages) {
			// 	sap.ui.getCore().byId("__xmlview1--prevBtn").setEnabled(false);
			// 	sap.ui.getCore().byId("__xmlview1--nextBtn").setEnabled(false);
			// }
		},
		triggerPaginationForMobileAndTablet: function (sEntity, aFilters, controlId, model, entityName, btnName) {
			var oController = sap.ui.getCore().byId("__xmlview0").getController();
			sap.ui.getCore().byId("BusyDialog").open();
			// console.log("pagination triggered");
			if (btnName === "prevBtn") {
				skipValForMbl = skipValForMbl - 50;
			} else if (btnName === "nextBtn") {
				// if()
				skipValForMbl = skipValForMbl + 50;
			}
			var sURL, count;
			if (!sURL) {
				if (!skipValForMbl && !top) {
					sURL = sEntity;
				} else {
					if(aSorters) {
						var property = aSorters[0].Property; 
						var sortOrder = aSorters[0].SortOrder;                      
						sURL = sEntity + "?$skip=" + skip + "&" + "$top=" + top  + "&" + "$orderby=" + property + " " + sortOrder ;
					}
                	else {
						sURL = sEntity + "?$skip=" + skip + "&" + "$top=" + top ;
                	}
				}
			}
			var oModel = sap.ui.getCore().getModel();
			var mParameters = {
				async: true,
				filters: aFilters,
				success: jQuery.proxy(function (oData, oResponse) {
					/*	var oList = sap.ui.getCore().byId("__xmlview0--list");*/
					if (oData.__count !== undefined) {
						count = oData.__count;
					}
					// skip += 50;
					if (oData.results.length < top) {
						stopReading = true;
					}
					for (var val in oData.results) {
						oData.results[val].VbelnNum = Number(oData.results[val].Vbeln);
						oData.results[val].PackQtySort = Number(oData.results[val].PackQty);
						oData.results[val].KwmengSort = Number(oData.results[val].Kwmeng);
						oData.results[val].NetprSort = parseFloat(oData.results[val].Netpr);
						oData.results[val].TotalAmtSort = parseFloat(oData.results[val].TotalAmt);
						oData.results[val].PoNumberSort = Number(oData.results[val].PoNumber);

					}
					var oDataJSONModel = new sap.ui.model.json.JSONModel();
					var obj = {};
					obj[entityName] = oData.results;
					oDataJSONModel.setData(obj);
					controlId.setModel(oDataJSONModel);

					flagforPagination = 0;

					this.setPaginationCountValue(count);
					this.setPageValue(pageNo, count);
					sap.ui.getCore().byId("BusyDialog").close();
				}, this),
				error: jQuery.proxy(function (oData, oResponse) {
					// $.loader.close();
					var oErrorResponse = jQuery.parseJSON(oData.response.body);
					// sap.ui.getCore().byId("__xmlview1--detailTable").setBusy(false);
					sap.ui.getCore().byId("BusyDialog").close();
					sap.ui.core.BusyIndicator.hide();
					console.log(oErrorResponse.error.message.value);

					oController.messageBoxError(oErrorResponse.error.message.value);
				}, this)
			};
			oModel.read(sURL, mParameters);
		},

		// Date filter dialog
		onDateFilter: function (oEvent) {
			this._dateFilterDialog.open();
			this.bindMonthSelection();
			this.bindApplyTo();
			var selectedYearVal = sap.ui.getCore().byId("fromDateYear").getModel().getData().YearSet[0].Gjahr;
			sap.ui.getCore().byId("fromDateYear").setSelectedKey(selectedYearVal);
		},
		onDateDlgClose: function (oEvent) {
			this._dateFilterDialog.close();
		},
		onYearChange: function(oEvent){
			var selectedYear = oEvent.getSource().getSelectedKey();
			var oDataJsonModel = new sap.ui.model.json.JSONModel();
			oDataJsonModel.getJSON();
			if(_.findLastIndex(oEvent.getSource().getModel().getData().YearSet, {Gjahr: selectedYear}) >= 0){
				sap.ui.getCore().byId("fromDateDay").setEnabled(true);
				sap.ui.getCore().byId("fromDateMonth").setEnabled(true);
				sap.ui.getCore().byId("toDateYear").setEnabled(true);
			}else{
				sap.ui.getCore().byId("fromDateDay").setEnabled(false);
				sap.ui.getCore().byId("fromDateMonth").setEnabled(false);
				sap.ui.getCore().byId("toDateYear").setEnabled(false);
			}
		},
		onMonthSelection: function (oEvent) {
			sap.ui.getCore().byId("fromDateDay").setEnabled(true);
			sap.ui.getCore().byId("toDateYear").setEnabled(true);
			sap.ui.getCore().byId("toDateMonth").setEnabled(true);
			sap.ui.getCore().byId("toDateDay").setEnabled(true);
			var selectedMonth = oEvent.getSource().getSelectedKey();
			var selectedRow = oEvent.getSource().data("row");
			this.bindDateValue(selectedMonth, selectedRow);

		},
		bindDateValue: function (selectedMonth, selectedRow) {
			var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			for (var i in months) {
				if (selectedMonth === months[i]) {
					var monthNumber = Number(i) + 1;
				}
			}
			console.log(monthNumber);
			var daysArr = [];

			var selectedYearVal = selectedRow === "From" ? Number(sap.ui.getCore().byId("fromDateYear").getSelectedKey()) : Number(sap.ui.getCore()
				.byId("toDateYear").getSelectedKey());
			var selectedRowEleId = selectedRow === "From" ? sap.ui.getCore().byId("fromDateDay") : sap.ui.getCore().byId("toDateDay");
			var noOfDaysInMonth = new Date(selectedYearVal, monthNumber, 0).getDate();
			for (var j = 1; j <= noOfDaysInMonth; j++) {
				var obj = {
					"Day": j
				};
				daysArr.push(obj);
			}
			var oDataJsonModel = new sap.ui.model.json.JSONModel();
			oDataJsonModel.setData({
				DaysSet: daysArr
			});
			selectedRowEleId.setModel(oDataJsonModel);
		},
		bindMonthSelection: function () {
			var monthsArr = [{
				"Month": "Jan"
			}, {
				"Month": "Feb"
			}, {
				"Month": "Mar"
			}, {
				"Month": "Apr"
			}, {
				"Month": "May"
			}, {
				"Month": "Jun"
			}, {
				"Month": "Jul"
			}, {
				"Month": "Aug"
			}, {
				"Month": "Sep"
			}, {
				"Month": "Oct"
			}, {
				"Month": "Nov"
			}, {
				"Month": "Dec"

			}];

			var oDataJsonModel = new sap.ui.model.json.JSONModel();
			oDataJsonModel.setData({
				Monthset: monthsArr
			});
			sap.ui.getCore().byId("fromDateMonth").setModel(oDataJsonModel);
			// id.binditems(/)
			sap.ui.getCore().byId("toDateMonth").setModel(oDataJsonModel);
		},
		bindApplyTo: function(){
			var applyArry = [{
				"value": "Created Date",
				"key": "Erdat"
			}, {
				"value": "Customer Ship Date",
				"key": "Vdatu"
			}, {
				"value": "Expected CRD",
				"key": "Eindt"
			}, {
				"value": "Actual Factory Delivery Date",
				"key": "ActualShipment"
			}, {
				"value": "Billed date",
				"key": "BilledDate"
			}, {
				"value": "Payment date",
				"key": "PaymentDate"
			}, {
				"value": "Expected In Store Date",
				"key": "ExpctdInStore"
			}];

			var oDataJsonModel = new sap.ui.model.json.JSONModel();
			oDataJsonModel.setData({
				ApplyTo: applyArry
			});
			sap.ui.getCore().byId("applyToId").setModel(oDataJsonModel);
		}

	});

});