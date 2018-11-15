//extend the ObjectListItem to set the intro to red if blocked
jQuery.sap.declare("zzuru.orders.orderSummaryZ_ORD_SUMMARY.extend.OrderListItem");
jQuery.sap.require("sap.ui.core.IconPool");
sap.m.ObjectListItem.extend("zzuru.orders.orderSummaryZ_ORD_SUMMARY.extend.OrderListItem", {
	metadata: {
		properties: {
			customer: {
				type: "string",
				group: "Misc",
				defaultValue: null
			}
			// generic: {
			// 	type: "string",
			// 	group: "Misc",
			// 	defaultValue: null
			// },
			// inDisplay: {
			// 	type: "string",
			// 	group: "Misc",
			// 	defaultValue: null
			// },
			// isPriority: {
			// 	type: "string",
			// 	group: "Misc",
			// 	defaultValue: null
			// }
		}
	},

	renderer: {},

	onAfterRendering: function() {
		// try {
			if (sap.m.ObjectListItem.prototype.onAfterRendering) {
				sap.m.ObjectListItem.prototype.onAfterRendering.apply(this, arguments);
			}
			// var oController = sap.ui.getCore().byId("__xmlview0").getController();
			var listItemObj = this.getBindingContext().getObject();
			this.$().find(".sapMObjLIntro").each(function() {
				if (listItemObj.Vdatu) {

					var shipDate =  listItemObj.Erdat.replace(/[^\w\s]/gi, '').replace(/Date/i,'');
					shipDate = new Date(Number(shipDate));
					var monthNames = [
						"January", "February", "March",
						"April", "May", "June", "July",
						"August", "September", "October",
						"November", "December"
					];

					var day = shipDate.getDate();
					var monthIndex = shipDate.getMonth();
					var year = shipDate.getFullYear();

					shipDate = day + "-" + monthNames[monthIndex] +  "-" + year;
				} else {
						shipDate = "";
				}

				this.innerHTML += "<span class='shipDateDiv'>" + shipDate + "</span>";
			});
			this.$().find(".sapMObjLTopRow").each(function() {
				this.innerHTML += "<span class='companyNameCls'>" + listItemObj.Spname + "</span>";
			});
			var table = $("<table style='font-size:14px;line-height: 11px;font-weight:500;width:70%;'></table>");
			$.each(listItemObj, function(key, value) {
				if (key === "ReferenceSo" || key === "Zscbm") {
					key = key === "ReferenceSo" ? "Internal Order No" : "Total Volume";
					var row = $("<tr class='soInfoCls'></tr>");
					var attrText = $("<td style='text-align:left;width:auto;font-size:13px'></td>");
					var attrVal = $("<td style='text-align:left !important;font-weight:bold;width:auto;font-size:13px'></td>");
					attrText.text(key + ":");
					attrVal.text(value);
					row.append(attrText);
					row.append(attrVal);
					table.append(row);
				}
			});
			$("#" + this.getId() + "-content").append(table);
			var sapMObjLBottomRowDiv = $(
				"<div class='sapMObjLBottomRow' style='width:100% !important;margin-top:15px;font-size:14px;display:flex'></div>");
			$("#" + this.getId() + "-content").append(sapMObjLBottomRowDiv);
			this.$().find(".sapMObjLBottomRow").each(function() {
				if (listItemObj.Erdat) {
					var createdDate =  listItemObj.Erdat.replace(/[^\w\s]/gi, '').replace(/Date/i,'');
					createdDate = new Date(Number(createdDate));
					var monthNames = [
						"January", "February", "March",
						"April", "May", "June", "July",
						"August", "September", "October",
						"November", "December"
					];

					var day = createdDate.getDate();
					var monthIndex = createdDate.getMonth();
					var year = createdDate.getFullYear();

					createdDate = day + "-" + monthNames[monthIndex] +  "-" + year;

				} else {
					createdDate = "";
				}
				this.innerHTML += "<div class='createdDateCls'><span>" + "Created Date:" + "<b>" + createdDate + "</b></span></div>";
				this.innerHTML += "<div class='deliveryStatusImg'><img src='./images/truck_delivered.svg'></img></div>";
			});
	/*	} catch (e) {*/
			// zsmyths.libs.messages.logError("extend.ObjectListItem.onAfterRendering-error:" + e.message);
		// 	oController.messageBoxError("extend.OrdeListItem.onAfterRendering-error:" + e.message);                  
		// }
	},
		messageBoxError: function(message) {
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