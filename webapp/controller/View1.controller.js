sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	//"sap/ui/unified/DateRange",
	"sap/m/MessageBox"
], function(Controller) {
	"use strict";
	return Controller.extend("Press_Shop_Fiori11z_stock_replenishment.controller.View1", {
		oController: this,
		oView: null,
		oFormatYyyymmdd: null,
		oitemSet: null,

		onInit: function() {
			this.oitemSet = new sap.ui.model.json.JSONModel({
				ItemSet: [
					/*{
						"Matnr": 1,
						"Maktx": "Apple",
						"Menge": "X"
					}*/
				]
			});
			this.oitemSet.setDefaultBindingMode("TwoWay");
			this.getView().setModel(this.oitemSet);
			this.oView = this.getView();
			var i18nModel = new sap.ui.model.resource.ResourceModel({
				bundleName: "Press_Shop_Fiori11z_stock_replenishment.i18n.i18n" //,
			});
			this.oView.setModel(i18nModel, "i18n");
			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
				pattern: "yyyy-MM-dd",
				calendarType: sap.ui.core.CalendarType.Gregorian
			});
			var osite = this.oView.byId("__PLANT");
			var URL = "/sap/opu/odata/sap/ZGET_PLANT_SRV/";
			var OData = new sap.ui.model.odata.ODataModel(URL, true);
			var query = "/S_T001WSet(Type='')";
			debugger;
			OData.read(query, null, null, true, function(response) {
				var plant = response.EPlant;
				var name1 = response.ET001w.Name1;
				var site = plant + " " + name1;
				osite.setText(site);
			});
		},

		chooseDate: function(evt) {
			this.oView.byId("chooseDate").setVisible(false);
			this.oView.byId("calendar").setVisible(true);
			this.oView.byId("label_date").setVisible(false);
			this.oView.byId("searchArt").setVisible(false);
		},

		handleCalendarSelect: function(evt) {
			var oCalendar = this.oView.byId("calendar");
			var aSelectedDates = oCalendar.getSelectedDates();
			if (aSelectedDates.length > 0) {
				var oDate = aSelectedDates[0].getStartDate();
				this.oView.byId("label_date").setText(this.oFormatYyyymmdd.format(oDate));
				this.oView.byId("chooseDate").setVisible(true);
				this.oView.byId("calendar").setVisible(false);
				this.oView.byId("label_date").setVisible(true);
				this.oView.byId("searchArt").setVisible(true);
			}
		},

		searchArt: function(evt) {
			var oView = this.getView();
			var oController = oView.getController();
			var material = oView.byId("searchArt").getValue();
			var URL = "/sap/opu/odata/sap/ZCHECK_VALUE_SCAN_SRV";
			var OData = new sap.ui.model.odata.ODataModel(URL, true);
			var query = "/MessageSet(PValue='06" + material + "')";
			debugger;
			OData.read(query, null, null, true, function(response) {
				if (response.EMessage !== "" && response.EZtype === "E") {
					var path = $.sap.getModulePath("Press_Shop_Fiori11z_stock_replenishment", "/audio");
					var aud = new Audio(path + "/MOREINFO.png");
					aud.play();
					oView.byId("searchArt").setValue("");
					sap.m.MessageBox.show(response.EMessage, sap.m.MessageBox.Icon.ERROR);
				} else {
					oController.getData(material);
				}
			});
		},

		getData: function(material) {
			var oView = this.getView();
			var oDate = oView.byId("label_date").getText();
			var URL = "/sap/opu/odata/sap/ZSTOCKREPLENISHMENT_SRV";
			var OData = new sap.ui.model.odata.ODataModel(URL, true);
			var query = "/ItemsSet(Matnr='" + material + "',ZDate=datetime'" + oDate + "T12:00')";
			debugger;
			OData.read(query, null, null, true, function(response) {
				var itemSet = oView.getModel().getProperty("/ItemSet");
				var lines = itemSet.length;
				var already_scanned = false;
				if (oView.byId("table1").getItems().length > 0) {
					for (var i = 1; i <= lines; i++) {
						if (itemSet[i - 1].Matnr === material) {
							already_scanned = true;
						}
					}
				}
				if (already_scanned === false) {
					itemSet.push({
						Number: lines,
						Matnr: response.Matnr,
						Maktx: response.Maktx,
						Menge: response.Menge
					});
					oView.byId("table1").setVisible(true);
					oView.getModel().refresh();
					oView.byId("searchArt").setValue("");
				} else {
					var path = $.sap.getModulePath("Press_Shop_Fiori11z_stock_replenishment", "/audio");
					var aud = new Audio(path + "/MOREINFO.png");
					aud.play();
					var infoMsg = oView.getModel("i18n").getResourceBundle().getText("article_already_scanned");
					sap.m.MessageBox.show(infoMsg, sap.m.MessageBox.Icon.ERROR);
					oView.byId("searchArt").setValue("");
				}
			});
		}
	});
});