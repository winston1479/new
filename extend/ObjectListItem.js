//extend the ObjectListItem to set the intro to red if blocked
jQuery.sap.declare("zzuru.orders.orderSummaryZ_ORD_SUMMARY.extend.ObjectListItem");
jQuery.sap.require("sap.ui.core.IconPool");
sap.m.ObjectListItem.extend("zzuru.orders.orderSummaryZ_ORD_SUMMARY.extend.ObjectListItem", {
	metadata: {
		properties: {
			blocked: {
				type: "string",
				group: "Misc",
				defaultValue: null
			},
			generic: {
				type: "string",
				group: "Misc",
				defaultValue: null
			},
			inDisplay: {
				type: "string",
				group: "Misc",
				defaultValue: null
			},
			isPriority: {
				type: "string",
				group: "Misc",
				defaultValue: null
			}
		}
	},
	renderer: {},

	onAfterRendering: function() {
		try {
			if (sap.m.ObjectListItem.prototype.onAfterRendering) {
				sap.m.ObjectListItem.prototype.onAfterRendering.apply(this, arguments);
			}
			//for each of the intro divs set it to red if blocked
			if (this.getBlocked() === "X") {
				this.$().find(".sapMObjLIntro").each(
					function() {
						$(this).addClass(zsmyths.libs.constants.classNegative);
					}
				);
			}
			//for each of the article name divs set it to blue if generic
			if (this.getGeneric() === "X") {
				this.$().find(".sapMObjLTitle").each(
					function() {
						$(this).addClass(zsmyths.libs.constants.classBlue);
					}
				);
			}
			//for each of the article name divs set it to green if in display
			if (this.getInDisplay() === "X") {
				this.$().find(".sapMObjLTitle").each(
					function() {
						$(this).addClass(zsmyths.libs.constants.classOrange);
					}
				);
			}
			if (this.getIsPriority()) {
				var that = this;
				var tooltip = this.getIsPriority();
				this.$().find(".sapMObjLIntro").each(
					function() {
						var hLayout = new sap.ui.layout.HorizontalLayout();
						var oFlagIcon = new sap.m.Label({
							text: "P",
							tooltip: zsmyths.erp.art.ao.util.constants.mstPriority + tooltip,
							design: "Bold"
						});
						oFlagIcon.addStyleClass("priorityLabel");
						oFlagIcon.setVisible(true);
						hLayout.addContent(oFlagIcon);
						hLayout.placeAt(this, "last");
					});
						// var oFlagIcon = sap.ui.core.IconPool.createControlByURI({
						// 	id: that.getId() + "-bookmark",
						// 	tooltip: zsmyths.erp.art.ao.util.constants.mstPriority,
						// 	src: oFlagIconUri,
						// 	color: "#FF0000",
						// 	size: "1.25rem"
						// });}, this));
			}
		} catch (e) {
			zsmyths.libs.messages.logError("extend.ObjectListItem.onAfterRendering-error:" + e.message);
		}
	},
		onSelect: function(oEvent) {
			var src= oEvent.getSource();
			console.log(oEvent);
		}
});