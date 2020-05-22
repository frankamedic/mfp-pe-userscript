// ==UserScript==
// @name            MyFitnessPal PE Ratio
// @version         1.17.1
// @namespace       frankamedic
// @description     Adds display of P:E Ratio to daily food diary pages.
// @downloadURL     https://github.com/frankamedic/mfp-pe-userscript/raw/master/mfppe.user.js
// @include         http*://www.myfitnesspal.com/food/diary*
// ==/UserScript==

/*
 *  ------------------------------------------------------------
 *  Much credit to Bompus, kt123, and Wickity for the original MFP Keto userscript.
 *  ------------------------------------------------------------
 */

function exec(fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = '(' + fn + ')();';
    document.body.appendChild(script); // run the script
    document.body.removeChild(script); // clean up
}

function startRun() {
    // Load Google API for Charts
    var script = document.createElement("script");
    script.setAttribute("src", "//www.google.com/jsapi");
    script.addEventListener('load', function() {
        exec(jsapiLoaded);
    }, false);
    document.body.appendChild(script);

    // Load jQuery
    script = document.createElement("script");
    script.setAttribute("src", "//ajax.googleapis.com/ajax/libs/jquery/1.10.0/jquery.min.js");
    script.addEventListener('load', function() {
        exec("jQuery.noConflict()");
    }, false);
    document.body.appendChild(script);

    // Inject this script into page.
    script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = main;
    document.body.appendChild(script);
}

startRun();

function jsapiLoaded() {
    google.load("visualization", "1", { packages: ["corechart"], "callback": main });
}

function main() {
    var calories_i = 0;
    var pe_ratio_i = 0;
    var carbs_i = 0;
    var fiber_i = 0;
    var protein_i = 0;
    var fat_i = 0;

    var daily_total_carbs = 0;
    var daily_total_protein = 0;
    var daily_total_fat = 0;

    var peratio_total = 0;
    var peratio_total_goal = 0;

    var header_tr_element = jQuery('.food_container tr.meal_header:first');

    var elem_i = 0;
    header_tr_element.find('td').each(function() {
        var myval = jQuery(this).text().toLowerCase().trim();
        if (myval.indexOf('calories') !== -1) { calories_i = elem_i; }
        if (myval.indexOf('carbs') !== -1) { carbs_i = elem_i; }
        if (myval.indexOf('fiber') !== -1) { fiber_i = elem_i; }
        if (myval.indexOf('fat') !== -1) { fat_i = elem_i; }
        if (myval.indexOf('protein') !== -1) { protein_i = elem_i; }

        elem_i += 1;
    });


    // Add new column for pe ratio
    var peratio_tr_elements = jQuery('tr');
    peratio_tr_elements.each(function() {
        var tds = jQuery(this).find('td');
        jQuery('<td></td>').insertBefore(tds.eq(carbs_i));

    });

    // Recalculate offsets
    pe_ratio_i = carbs_i;
    calories_i = calories_i >= pe_ratio_i ? calories_i + 1 : calories_i;
    carbs_i = carbs_i >= pe_ratio_i ? carbs_i + 1 : carbs_i;
    fiber_i = fiber_i >= pe_ratio_i ? fiber_i + 1 : fiber_i;
    protein_i = protein_i >= pe_ratio_i ? protein_i + 1 : protein_i;
    fat_i = fat_i >= pe_ratio_i ? fat_i + 1 : fat_i;

    // Set header
    header_tr_element.find('td').eq(pe_ratio_i).text("P:E Ratio");
    header_tr_element.find('td').eq(pe_ratio_i).addClass("alt");
    header_tr_element.find('td').eq(pe_ratio_i).addClass("nutrient-column");



    // Change footer to say pe ratio
    var footer_tr_element = jQuery('tfoot tr');
    footer_tr_element.find('td').eq(pe_ratio_i).text("P:E");
    footer_tr_element.find('td').eq(pe_ratio_i).addClass("alt");
    header_tr_element.find('td').eq(pe_ratio_i).addClass("nutrient-column");
    //set PE ratio per food
    var food_tr_elements = jQuery('tr');

    food_tr_elements.each(function() {

        var tds = jQuery(this).find('td');
        var carbs = parseFloat(tds.eq(carbs_i).text());
        var fiber = parseFloat(tds.eq(fiber_i).text());
        var fat = parseFloat(tds.eq(fat_i).text());
        var protein = parseFloat(tds.eq(protein_i).text());
        var energy = carbs + fat - fiber;
        var perfoodpe = protein / energy;
        var perfoodperounded = perfoodpe.toFixed(2)

        // Find only food rows!
        var delete_td = tds.eq(tds.length - 1);
        if (delete_td.hasClass('delete')) {
			var name = jQuery(this).find('.js-show-edit-food').text().toLowerCase();

			tds.eq(pe_ratio_i).text(perfoodperounded);
            }
    });

//handle meal rows
    var bottom_tr_elements = jQuery('.food_container tr.bottom, .food_container tr.total');
    bottom_tr_elements.each(function() {

        if (jQuery(this).hasClass('remaining')) {
            return false; /* continue */
        }

        var tds = jQuery(this).find('td');
        var cals = parseFloat(tds.eq(calories_i).text());
        var carbs = carbs = parseFloat(tds.eq(carbs_i).text());
        var fiber = parseFloat(tds.eq(fiber_i).text());
        var protein = parseFloat(tds.eq(protein_i).text());
        var fat = parseFloat(tds.eq(fat_i).text());
        var energy = carbs + fat - fiber;
        var pe_ratio = 0.7;
        var pe = protein / energy;
        var pe_ratio_rounded = pe.toFixed(2)

        // show pe ratio
        if (!jQuery(this).hasClass('alt')) {
            pe_ratio = pe_ratio_rounded;
            if (!isNaN(pe_ratio)) {
                tds.eq(pe_ratio_i).text(pe_ratio);
            } else if (jQuery(this).hasClass("total")) {
                tds.eq(pe_ratio_i).text("0");
            }
        } else {
            // record goal
            peratio_total_goal = pe_ratio;
        }
        /* do nothing if cannot calculate for the row */
        if (isNaN(cals) ||
            isNaN(carbs) ||
            isNaN(protein) ||
            isNaN(fat) ||
            isNaN(fiber) ||
            isNaN(pe_ratio) ||
            cals === 0) {
            return true;
        }
        tds.eq(pe_ratio_i).text(pe_ratio);
        peratio_total = pe_ratio;
        });
}
