sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
], function (Controller, JSONModel, MessageBox) {
	"use strict";
	var stopReading = false,
		flagforPagination = 0,
		totalPages;

	jQuery.sap.require("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.formatter");
	jQuery.sap.require("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.underscore");
	jQuery.sap.require("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.LoadingIcon");

	return Controller.extend("zzuru.orders.orderSummaryZ_ORD_SUMMARY.libs.oDataOperations", {
		oDataCallOpen: 0,
		oDataCallClose: 0,

		readOperation: function (sEntity, aFilters, controlId, model, skip, top, multipleId, busySrc, singleValue, isLayout,
			isTreeTable, asyncInd, control, entityName, busyDialogOpen, busyDialogClose, aSorters) {

			// if (sEntity == "/HierarchyTreeSet") {
			// 	console.log("sEntity = ", sEntity);
			// 	return false;
			// }
			if (sap.ui.getCore().byId("BusyDialog") !== undefined && busyDialogOpen !== "X") {
				sap.ui.getCore().byId("BusyDialog").open();
			}
			if (asyncInd !== false) {
				asyncInd = true;
			}
			var scope = this;
			var oModel;
			var flag;
			var oController = sap.ui.getCore().byId("__xmlview0").getController();
			var sURL, entity, count;
			if (!sURL) {
				if (singleValue) {
					if (controlId === "pdf" && singleValue) {
						sURL = sEntity + "(Vbeln=" + "'" + singleValue + "'" + ")/$value";
					} else {
						sURL = sEntity + "(" + "'" + singleValue + "'" + ")";
					}
				} else if (!skip && !top) {
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
			entity = sEntity;
			oModel = model;
			if (sEntity !== "") {
				var mParameters = {
					async: asyncInd,
					filters: aFilters,
					sorter: aSorters,
					success: jQuery.proxy(function (oData, oResponse) {
						if (oData.__count !== undefined) {
							count = oData.__count;
							this.setPaginationCountValue(skip, count);
						}
						// console.log(oData.results);
						skip += 50;
						var oDataJSONModel = new sap.ui.model.json.JSONModel();
						oDataJSONModel.setSizeLimit(10000);
						var obj, sData;
						if (oData.results && oData.results.length < top) {
							stopReading = true;
						}
						if (entityName === "DetailViewSet") {
							for (var val in oData.results) {
								oData.results[val].VbelnNum = Number(oData.results[val].Vbeln);
								oData.results[val].PackQtySort = Number(oData.results[val].PackQty);
								oData.results[val].KwmengSort = Number(oData.results[val].Kwmeng);
								oData.results[val].NetprSort = parseFloat(oData.results[val].Netpr);
								oData.results[val].TotalAmtSort = parseFloat(oData.results[val].TotalAmt);
								oData.results[val].PoNumberSort = Number(oData.results[val].PoNumber);

							}
						}
						if (multipleId === "X") {
							controlId = Object.values(controlId);
							var idLength = controlId.length;
							for (var i = 0; i < idLength; i++) {
								obj = {};
								obj[entityName] = oData.results;
								oDataJSONModel.setData(obj);
								controlId[i].setModel(oDataJSONModel);

								sap.ui.core.BusyIndicator.hide();
								flagforPagination = 0;
							}
						} else if (isTreeTable === "X") {
							var results = this.BuildTreeStructure(oData.results);
							obj = {};
							obj[entityName] = results;
							oDataJSONModel.setData(obj);
							controlId.setModel(oDataJSONModel);
							controlId.bindRows("/" + entityName);
							sap.ui.core.BusyIndicator.hide();
						} else if (isLayout === "X") {
							sData = oData.results === undefined ? oData : oData.results;
							obj = {};
							obj[entityName] = sData;
							oDataJSONModel.setData(obj);
							controlId.setModel(oDataJSONModel);
							controlId.bindElement("/" + entityName);
							sap.ui.core.BusyIndicator.hide();
						} else {

							sData = oData.results === undefined ? oData : oData.results;
							obj = {};
							obj[entityName] = sData;
							oDataJSONModel.setData(obj);
							controlId.setModel(oDataJSONModel);

							sap.ui.core.BusyIndicator.hide();
							flagforPagination = 0;
						}
						if (control == "Table") {

							controlId.bindRows("/" + entityName);
							sap.ui.core.BusyIndicator.hide();
						}
						// else if (control === "list") {
						// 	controlId.bindItems("/" + entityName);
						// }
						if (sap.ui.getCore().byId("BusyDialog") !== undefined && busyDialogClose !== 'X') {
							sap.ui.getCore().byId("BusyDialog").close();
						}
						flag = true;
						return flag;

					}, this),
					error: jQuery.proxy(function (oData, oResponse) {
						// $.loader.close();
						this.oDataCallClose += 1;
						console.log("close:::" + this.oDataCallClose);
						var oErrorResponse = jQuery.parseJSON(oData.response.body);
						console.log(oErrorResponse.error.message.value);
						sap.ui.core.BusyIndicator.hide();
						scope.messageBoxError(oErrorResponse.error.message.value);
					}, this)
				};
				console.log("URL = ", sURL);
				oModel.read(sURL, mParameters);
			}
			if (count) {

				return count;
			}
			// if (flag) {
			// 	return flag;
			// }

		},

		createOperation: function (sEntity, createObject) {
			var oModel = sap.ui.getCore().getModel();
			var oAddParams = {
				async: true,
				success: jQuery.proxy(function (oData, oResponse) {
					sap.ui.core.BusyIndicator.hide();
					var dialog = new sap.m.Dialog({
						title: 'Sales Order Created',
						type: 'Message',
						state: 'Success',
						content: [new sap.m.VBox({
								id: "salesVbox",
								items: [
									new sap.m.Text({
										id: "fourthPartyText",
										text: "Fourth Party Order : " + oData.Vbeln1

									}),
									new sap.m.Text({
										id: "internalOrderText",
										text: "Internal Order :" + oData.Vbeln
									})
								]

							})

						],
						beginButton: new sap.m.Button({
							text: 'OK',
							press: function () {
								dialog.close();
							}
						}),
						afterClose: function () {
							dialog.destroy();
						}
					});

					dialog.open();
					/*	sap.m.MessageToast.show("Sales order values updated successfully.");*/
					/*this._oDialog.close();*/
				}, this),
				error: jQuery.proxy(function (oData, oResponse) {
					var oErrorResponse = jQuery.parseJSON(oData.response.body);
					sap.m.MessageBox.error(oErrorResponse.error.message.value, {
						title: "Error", // default
						textDirection: sap.ui.core.TextDirection.Inherit // default
					});
					sap.ui.core.BusyIndicator.hide();
				}, this)
			};

			oModel.create(sEntity, createObject, oAddParams);

		},
		BuildTreeStructure: function (results) {
			// console.log("Hierarachy -" + results);
			var isbrandArr = false;
			var hierarchies = results;
			var Brandkeysrr = Object.keys(hierarchies[0]);
			for (var i in Brandkeysrr) {
				if (Brandkeysrr[i] === "Parent1" || Brandkeysrr[i] === "Parent2" || Brandkeysrr[i] === "Parent3") {
					isbrandArr = true;
				}
			}
			if (isbrandArr === true) {

				var resultObject = {
					"rows": []
				};
				var types = ["", "brand", "category", "subCategory", "SKU"];
				hierarchies = hierarchies.sort(function (a, b) {
					return a.HierarchyLevel - b.HierarchyLevel;
				});

				hierarchies.forEach(function (hierarchy, index) {

					var objectReference = resultObject.rows;

					var brands = resultObject.rows.filter(function (brand) {
						return brand.value === hierarchy.Parent1;
					});

					if (typeof brands !== "undefined" && brands.length > 0) {
						objectReference = brands[0].rows;
						var categories = brands[0].rows.filter(function (category) {
							return category.value === hierarchy.Parent2;
						});

						if (typeof categories !== "undefined" && categories.length > 0) {
							objectReference = categories[0].rows;
							var subCategories = categories[0].rows.filter(function (subCategory) {
								return subCategory.value === hierarchy.Parent3;
							});

							if (typeof subCategories !== "undefined" && subCategories.length > 0) {
								objectReference = subCategories[0].rows;
							}
						}
					}

					objectReference.push({
						"type": types[hierarchy.HierarchyLevel],
						"value": hierarchy.Node,
						"description": hierarchy.Description || hierarchy.Node,
						"rows": [],
						"Brand": hierarchy.Parent1,
						"catogory": hierarchy.Parent2,
						"Subcatogory": hierarchy.Parent3
					});

				});
				// console.log("hierarchyobj")
				console.log(resultObject);

				return resultObject;
			} else {
				var resultObj = this.BuildCountryTreeStructure(hierarchies);
				return resultObj;
			}
		},
		BuildCountryTreeStructure: function (results) {

			var hierarchies = results;
			var resultObject = {
				"rows": []
			};
			var types = ["Continent", "country"];

			hierarchies.forEach(function (hierarchy, index) {

				var objectReference = resultObject.rows;
				var continents = resultObject.rows.filter(function (continent) {
					return continent.value === hierarchy.Parent;
				});
				if (typeof continents !== "undefined" && continents.length > 0) {
					objectReference = continents[0].rows;
					var countries = continents[0].rows.filter(function (country) {
						return country.value === hierarchy.Parent;
					});

				}
				objectReference.push({
					"type": hierarchy.Parent === "" ? types[0] : types[1],
					"value": hierarchy.Node,
					"description": hierarchy.Description,
					"rows": [],
					"Continent": hierarchy.Parent,
					"selected": "Unchecked"
				});

			});
			// console.log(resultObject);
			return resultObject;

		},
		setPaginationCountValue: function (skip, count) {
			skip = 50;
			if (skip < count) {
				sap.ui.getCore().byId("__xmlview1--pagingText").setText("Showing " + skip + " / " + count);
			} else if (skip > count) {
				sap.ui.getCore().byId("__xmlview1--pagingText").setText("Showing " + count + " / " + count);
			}
			totalPages = count / 50;
			totalPages = Math.ceil(totalPages);
			this.setPageValue(totalPages);
		},
		setPageValue: function (page) {
			var pageNo = 1;
			sap.ui.getCore().byId("__xmlview1--pageText").setText("1" + " of " + totalPages);
			// if (page) {
			// 	sap.ui.getCore().byId("__xmlview1--pageText").setText(page + " of " + totalPages);
			// }
			if (pageNo === 1) {
				sap.ui.getCore().byId("__xmlview1--prevBtn").setEnabled(false);
			}
			if (pageNo > 1) {
				sap.ui.getCore().byId("__xmlview1--prevBtn").setEnabled(true);
			}
			if (pageNo === 1 && totalPages === 1) {
				sap.ui.getCore().byId("__xmlview1--prevBtn").setEnabled(false);
				sap.ui.getCore().byId("__xmlview1--nextBtn").setEnabled(false);
			}
			if (pageNo === 1 && totalPages !== 1) {
				sap.ui.getCore().byId("__xmlview1--prevBtn").setEnabled(false);
				sap.ui.getCore().byId("__xmlview1--nextBtn").setEnabled(true);
			}
			// if (pageNo === totalPages) {
			// 	sap.ui.getCore().byId("__xmlview1--prevBtn").setEnabled(true);
			// 	sap.ui.getCore().byId("__xmlview1--nextBtn").setEnabled(false);
			// }
		},
		messageBoxError: function (message) {
			sap.m.MessageBox.show(
				message, {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "ERROR",
					initialFocus: null,
					actions: [sap.m.MessageBox.Action.OK]
				}
			);
		}

	});
});