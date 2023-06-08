// © Copyright 2014-2023 by ASNA, Inc.
//
// ASNA Inspection Report Viewer
//
// Some icons by Yusuke Kamiyamane (http://p.yusukekamiyamane.com/). All rights reserved.
//
// JSLint identifiers
/*global $, document: false, $Rows, window, DOMParser, ActiveXObject */

var ASNA = ASNA || {};

ASNA.ForensicsPage = (function () {
    "use strict";
    var $xml, $myLayout, stateResetSettings;

    function updateCSS(style) {
        document.getElementById('page_css').href = 'https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/CSS/' + style + '.css';
    }

    function resetLayout() {
        $myLayout = $('#content').layout(stateResetSettings);
        $myLayout.panes.north.css('backgroundColor', '#e0e0e0');
        $myLayout.panes.north.css('overflow', 'hidden');
        $myLayout.panes.south.css('overflow', 'hidden');
        $myLayout.panes.west.css('backgroundColor', '#e6e7ff');
    }

    function walkTheTree($node, func) {
        $node.find('*').each(function () {
            func($(this));
        });
    }

    function getNodesByAttr($start, att, value) {
        var results = [];
        walkTheTree($start, function ($node) {
            var actual = $node.attr(att);
            if (actual === value) {
                results.push($node);
            }
        });
        return results;
    }

    function convertTreeToUL($start, area) {
        var htmlArray = [];
        $start.children().each(function () {
            var $node, origPath, cleanPath;
            $node = $(this);
            origPath = $node.attr('Path');
            cleanPath = origPath.replace(/\\/g, '\\\\');
            if ($node.get(0).nodeName === 'Folder') {
                htmlArray.push('<li>');
                htmlArray.push('<a href="#" onclick="DisplayFolderDetails(\'' + cleanPath + '\', \'' + area + '\');">' + $node.attr('Name') + '</a>');
                htmlArray.push('<ul>');
                htmlArray.push(convertTreeToUL($node, area));
                htmlArray.push('</ul>');
                htmlArray.push('</li>');
            } else if ($node.get(0).nodeName === 'File') {
                htmlArray.push('<li><a href="#" onclick="DisplayFileDetails(\'' + cleanPath + '\', \'' + area + '\');">');
                htmlArray.push($node.attr('Name'));
                htmlArray.push('</a></li>');
            }
        });
        return '<ul>' + htmlArray.join('') + '</ul>';
    }

    function stripeRows(tableSelector) {
        var $Rows, i;
        $Rows = $(tableSelector + ' tr');
        for (i = 1; i < $Rows.length; i += 2) {
            $Rows.eq(i).addClass('alt');
        }
    }

    function displaySystemInformation() {
        updateCSS('arp');
        var htmlArray, $system, $operatingSystem, htmlString, centerContent;
        htmlArray = [];
        $system = $xml.find('System');
        htmlArray.push('<DIV>');
        htmlArray.push('<fieldset><legend>System</legend>');
        htmlArray.push('<p>');
        htmlArray.push('Architecture: ');
        htmlArray.push($system.attr('Architecture'));
        htmlArray.push('<br />');
        htmlArray.push('Memory: ');
        htmlArray.push($system.attr('Memory'));
        htmlArray.push('<p>Drives</p>');
        htmlArray.push('<DIV id="drivesheader" class="header tableWrapper">');
        htmlArray.push('<TABLE width="100%" cellspacing="0">');
        htmlArray.push('<COL class="c1">');
        htmlArray.push('<COL class="c2">');
        htmlArray.push('<COL class="c3">');
        htmlArray.push('<COL class="c4">');
        htmlArray.push('<TR>');
        htmlArray.push('<TD class="c1">Drive</TD>');
        htmlArray.push('<TD class="c2">Type</TD>');
        htmlArray.push('<TD class="c3">Size</TD>');
        htmlArray.push('<TD class="c4">Free Space</TD>');
        htmlArray.push('</TR>');
        htmlArray.push('</TABLE>');
        htmlArray.push('</DIV>');
        htmlArray.push('<DIV id="arpbody" class="tableData tableWrapper">');
        htmlArray.push('<DIV class="innerWrapper">');
        htmlArray.push('<TABLE width="100%" cellspacing="0">');
        htmlArray.push('<COL class="c1">');
        htmlArray.push('<COL class="c2">');
        htmlArray.push('<COL class="c3">');
        htmlArray.push('<COL class="c4">');
        $($system).find('Drive').each(function () {
            htmlArray.push('<TR>');
            htmlArray.push('<TD>');
            var diskName = $(this).attr('Name');
            if ($(this).attr('Label')) {
                diskName += ' (' + $(this).attr('Label') + ')';
            }
            htmlArray.push(diskName);
            htmlArray.push('</TD>');
            htmlArray.push('<TD>');
            htmlArray.push($(this).attr('Type'));
            htmlArray.push('</TD>');
            htmlArray.push('<td style="text-align: right">');
            htmlArray.push($(this).attr('TotalSize'));
            htmlArray.push('</TD>');
            htmlArray.push('<td style="text-align: right">');
            htmlArray.push($(this).attr('TotalFreeSpace'));
            htmlArray.push('</TD>');
            htmlArray.push('</TR>');
        });
        htmlArray.push('</TABLE>');
        htmlArray.push('</DIV>');
        htmlArray.push('</DIV>');
        htmlArray.push('</fieldset>');
        htmlArray.push('<br />');
        $operatingSystem = $xml.find('OperatingSystem');
        htmlArray.push('<fieldset><legend>Operating System</legend>');
        htmlArray.push('<p>');
        htmlArray.push('Version: ');
        htmlArray.push($operatingSystem.attr('Version'));
        htmlArray.push('<br />');
        htmlArray.push('Service Packs: ');
        htmlArray.push($operatingSystem.attr('ServicePacks'));
        htmlArray.push('<br />');
        htmlArray.push('Architecture: ');
        htmlArray.push($operatingSystem.attr('Architecture'));
        htmlArray.push('</p>');
        htmlArray.push('</fieldset>');
        htmlArray.push('</DIV>');
        htmlString = htmlArray.join('');
        centerContent = document.getElementById('center');
        centerContent.innerHTML = htmlString;

        stripeRows('.tableData table', 'alt'); // add table-row-striping
        $('div.header, div.footer').css('paddingRight', $.layout.scrollbarWidth() + 'px');
        // update the layout
        resetLayout();
        $myLayout.hide("west");
        $myLayout.hide("east");
    }

    function displayDotNetInformation() {
        updateCSS('arp');
        var htmlArray, $dotnet, htmlString, centerContent;
        htmlArray = [];
        $dotnet = $xml.find('DotNetFrameworks');
        htmlArray.push('<DIV>');
        htmlArray.push('<fieldset><legend>Frameworks</legend>');
        htmlArray.push('<DIV id="drivesheader" class="header tableWrapper">');
        htmlArray.push('<TABLE width="100%" cellspacing="0">');
        htmlArray.push('<COL class="c1">');
        htmlArray.push('<COL class="c2">');
        htmlArray.push('<COL class="c3">');
        htmlArray.push('<TR>');
        htmlArray.push('<TD class="c1">Version</TD>');
        htmlArray.push('<TD class="c2">Service Pack</TD>');
        htmlArray.push('<TD class="c3" style="text-align: left">Level</TD>');
        htmlArray.push('</TR>');
        htmlArray.push('</TABLE>');
        htmlArray.push('</DIV>');
        htmlArray.push('<DIV id="arpbody" class="tableData tableWrapper">');
        htmlArray.push('<DIV class="innerWrapper">');
        htmlArray.push('<TABLE width="100%" cellspacing="0">');
        htmlArray.push('<COL class="c1">');
        htmlArray.push('<COL class="c2">');
        htmlArray.push('<COL class="c3">');
        $($dotnet).find('Framework').each(function () {
            htmlArray.push('<TR>');
            htmlArray.push('<TD>');
            htmlArray.push($(this).attr('Name'));
            htmlArray.push('</TD>');
            htmlArray.push('<TD>');
            var sp = '';
            if ($(this).attr('ServicePack')) {
                sp += 'SP ' + $(this).attr('ServicePack');
            }
            htmlArray.push(sp);
            htmlArray.push('</TD>');
            htmlArray.push('<TD>');
            htmlArray.push($(this).attr('Level'));
            htmlArray.push('</TD>');
            htmlArray.push('</TR>');
        });
        htmlArray.push('</TABLE>');
        htmlArray.push('</DIV>');
        htmlArray.push('</DIV>');
        htmlArray.push('</fieldset>');
        htmlArray.push('<br />');

        htmlArray.push('<fieldset><legend>Templates</legend>');
        htmlArray.push('<DIV id="drivesheader" class="header tableWrapper">');
        htmlArray.push('<TABLE width="100%" cellspacing="0">');
        htmlArray.push('<COL class="c1">');
        htmlArray.push('<COL class="c2">');
        htmlArray.push('<COL class="c3">');
        htmlArray.push('<COL class="c4">');
        htmlArray.push('<TR>');
        htmlArray.push('<TD class="c1">Name</TD>');
        htmlArray.push('<TD class="c2">Short Name</TD>');
        htmlArray.push('<TD class="c3" style="text-align: left">Language</TD>');
        htmlArray.push('<TD class="c4" style="text-align: left">Tags</TD>');
        htmlArray.push('</TR>');
        htmlArray.push('</TABLE>');
        htmlArray.push('</DIV>');
        htmlArray.push('<DIV id="arpbody" class="tableData tableWrapper">');
        htmlArray.push('<DIV class="innerWrapper">');
        htmlArray.push('<TABLE width="100%" cellspacing="0">');
        htmlArray.push('<COL class="c1">');
        htmlArray.push('<COL class="c2">');
        htmlArray.push('<COL class="c3">');
        htmlArray.push('<COL class="c4">');
        $($dotnet).find('Template').each(function () {
            htmlArray.push('<TR>');
            htmlArray.push('<TD>');
            htmlArray.push($(this).attr('Name'));
            htmlArray.push('</TD>');
            htmlArray.push('<TD>');
            htmlArray.push($(this).attr('ShortName'));
            htmlArray.push('</TD>');
            htmlArray.push('<TD>');
            htmlArray.push($(this).attr('Language'));
            htmlArray.push('</TD>');
            htmlArray.push('<TD>');
            htmlArray.push($(this).attr('Tags'));
            htmlArray.push('</TD>');
            htmlArray.push('</TR>');
        });
        htmlArray.push('</TABLE>');
        htmlArray.push('</DIV>');
        htmlArray.push('</DIV>');
        htmlArray.push('</fieldset>');
        htmlArray.push('<br />');

        htmlArray.push('</DIV>');
        htmlString = htmlArray.join('');
        centerContent = document.getElementById('center');
        centerContent.innerHTML = htmlString;

        stripeRows('.tableData table', 'alt'); // add table-row-striping
        $('div.header, div.footer').css('paddingRight', $.layout.scrollbarWidth() + 'px');
        // update the layout
        resetLayout();
        $myLayout.hide("west");
        $myLayout.hide("east");
    }

    function displayAddRemovePrograms() {
        updateCSS('arp');
        var $programs, htmlArray, htmlString, centerContent;
        $programs = $xml.find('AddRemovePrograms');
        htmlArray = [];
        htmlArray.push('<DIV id="arpheader" class="header tableWrapper">');
        htmlArray.push('<TABLE width="100%" cellspacing="0">');
        htmlArray.push('<COL class="c1">');
        htmlArray.push('<COL class="c2">');
        htmlArray.push('<COL class="c3">');
        htmlArray.push('<COL class="c4">');
        htmlArray.push('<COL class="c5">');
        htmlArray.push('<TR>');
        htmlArray.push('<TD class="c1">Name</TD>');
        htmlArray.push('<TD class="c2">Publisher</TD>');
        htmlArray.push('<TD class="c3">Install Date</TD>');
        htmlArray.push('<TD class="c4">Size</TD>');
        htmlArray.push('<TD class="c5">Version</TD>');
        htmlArray.push('</TR>');
        htmlArray.push('</TABLE>');
        htmlArray.push('</DIV>');
        htmlArray.push('<DIV id="arpbody" class="tableData tableWrapper">');
        htmlArray.push('<DIV class="innerWrapper">');
        htmlArray.push('<TABLE width="100%" cellspacing="0">');
        htmlArray.push('<COL class="c1">');
        htmlArray.push('<COL class="c2">');
        htmlArray.push('<COL class="c3">');
        htmlArray.push('<COL class="c4">');
        htmlArray.push('<COL class="c5">');
        $($programs).find('Program').each(function () {
            htmlArray.push('<tr>');
            htmlArray.push('<td><span>');
            htmlArray.push($(this).attr('Name'));
            htmlArray.push('</td></span>');
            htmlArray.push('<td>');
            htmlArray.push($(this).attr('Publisher'));
            htmlArray.push('</td>');
            htmlArray.push('<td style="text-align: right">');
            htmlArray.push($(this).attr('InstallDate'));
            htmlArray.push('</td>');
            htmlArray.push('<td style="text-align: right">');
            htmlArray.push($(this).attr('Size'));
            htmlArray.push('</td>');
            htmlArray.push('<td style="text-align: right">');
            htmlArray.push($(this).attr('Version'));
            htmlArray.push('</td>');
            htmlArray.push('</tr>');
        });
        htmlArray.push('</TABLE>');
        htmlArray.push('</DIV>');
        htmlArray.push('</DIV>');
        htmlString = htmlArray.join('');
        centerContent = document.getElementById('center');
        centerContent.innerHTML = htmlString;

        stripeRows('.tableData table', 'alt'); // add table-row-striping
        $('div.header, div.footer').css('paddingRight', $.layout.scrollbarWidth() + 'px');
        // update the layout
        resetLayout();
        $myLayout.hide("west");
        $myLayout.hide("east");
    }

    function displayGAC() {
        var $gac, htmlArray, htmlString, west, center;
        updateCSS('tree_details');
        $gac = $xml.find('GAC');

        if ($($gac).find('File').length < 1) {
            htmlString = '<p>There are no files in the GAC at this time.</p>';
            center = document.getElementById('center');
            center.innerHTML = htmlString;
            resetLayout();
            $myLayout.hide("east");
            $myLayout.hide("west");
            return;
        }

        htmlArray = [];

        htmlArray.push('<div id="quicklinks" class="clearfix">');
        htmlArray.push('<ul>');
        htmlArray.push('<li onclick="$(\'#gacTree\').jstree(\'open_all\');">');
        htmlArray.push('<a href="#">');
        htmlArray.push('Expand All');
        htmlArray.push('</a></li>');
        htmlArray.push('<li onclick="$(\'#gacTree\').jstree(\'close_all\');">');
        htmlArray.push('<a href="#">');
        htmlArray.push('Collapse All');
        htmlArray.push('</a></li>');
        htmlArray.push('</ul>');
        htmlArray.push('</div>');

        htmlArray.push('<div id="gacTree">');
        htmlArray.push(convertTreeToUL($gac, 'GAC'));
        htmlArray.push('</div>');
        htmlString = htmlArray.join('');
        west = document.getElementById('west');
        west.innerHTML = htmlString;
        resetLayout();
        $myLayout.hide("east");
        $myLayout.panes.west.css('backgroundColor', '#e6e7ff');
        $("#gacTree")
            .jstree({
                "themes": {
                    "theme": "default",
                    "dots": false,
                    "icons": true,
                    "url": false
                },
                "core": {
                    "animation": 0
                },
                "plugins": ["themes", "html_data", "ui"]
            });
        $('#gacTree a').first().click();
    }

    function displayASNALicensing() {
        updateCSS('licensing');
        var $licenses, htmlArray, htmlString, westContent, content;
        $licenses = $xml.find('ASNALicensing');

        // check if any products are listed
        if ($($licenses).find('Product').length < 1) {
            content = document.getElementById('center');
            content.innerHTML = '<p>' + $licenses.text() + '</p>';
            resetLayout();
            $myLayout.hide("east");
            $myLayout.hide("west");
            return;
        }

        htmlArray = [];
        htmlArray.push('<DIV id="licheader" class="header tableWrapper">');
        htmlArray.push('<TABLE width="100%" cellspacing="0">');
        htmlArray.push('<COL class="c1">');
        htmlArray.push('<COL class="c2">');
        htmlArray.push('<TR>');
        htmlArray.push('<TD class="c1">Valid</TD>');
        htmlArray.push('<TD class="c2">Product</TD>');
        htmlArray.push('</TR>');
        htmlArray.push('</TABLE>');
        htmlArray.push('</DIV>');
        htmlArray.push('<DIV id="licbody" class="tableData tableWrapper">');
        htmlArray.push('<DIV class="innerWrapper">');
        htmlArray.push('<TABLE width="100%" cellspacing="0">');
        htmlArray.push('<COL class="c1">');
        htmlArray.push('<COL class="c2">');
        $($licenses).find('Product').each(function () {
            htmlArray.push('<tr onclick="DisplayLicenseDetails(\'' + $(this).attr('Name') + '\');">');
            htmlArray.push('<td>');
            if ($(this).attr('Valid') === 'True') {
                htmlArray.push('<img src="https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/valid.png" alt="Valid" />');
            } else {
                htmlArray.push('<img src="https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/invalid.png" alt="Invalid" />');
            }
            htmlArray.push('</td>');
            htmlArray.push('<td><span>');
            htmlArray.push($(this).attr('Name'));
            htmlArray.push('</span></td>');
            htmlArray.push('</tr>');
        });
        htmlArray.push('</TABLE>');
        htmlArray.push('</DIV>');
        htmlArray.push('</DIV>');
        htmlString = htmlArray.join('');
        westContent = document.getElementById('west');
        westContent.innerHTML = htmlString;

        // details
        htmlArray = [];
        htmlArray.push('<div id="generalInfo">');
        htmlArray.push('<p>');
        htmlArray.push('<strong>Machine Code: </strong>');
        htmlArray.push($licenses.attr('MachineCode'));
        htmlArray.push('<br />');
        htmlArray.push('<strong>CPUs: </strong>');
        htmlArray.push($licenses.attr('CPUCount'));
        htmlArray.push('<br />');
        htmlArray.push('<strong>Cores: </strong>');
        htmlArray.push($licenses.attr('CoreCount'));
        htmlArray.push('</p>');
        htmlArray.push('<p><strong>Details:</strong></p>');
        htmlArray.push('</div>');
        htmlArray.push('<div id="details">');
        htmlArray.push('<p>Please select a license to view it\'s details.</p>');
        htmlArray.push('</div>');
        htmlString = htmlArray.join('');
        content = document.getElementById('center');
        content.innerHTML = htmlString;

        stripeRows('.tableData table'); // add table-row-striping
        $('div.header, div.footer').css('paddingRight', $.layout.scrollbarWidth() + 'px');

        // update the layout
        $myLayout = $('#content').layout({
            west__contentSelector: 'div.tableData',
            resizeWhileDragging: true,
            north__slidable: false,
            north__resizable: false,
            north__closable: false,
            north__size: 30,
            north__spacing_open: 0,
            south__slidable: false,
            south__resizable: false,
            south__closable: false,
            south__size: 20,
            south__spacing_open: 0,
            east__fxName_close: "none",
            west__size: 500,
            west__slidable: false,
            west__resizable: false,
            west__closable: false,
            west__spacing_open: 0
        });
        $myLayout.panes.north.css('backgroundColor', '#e0e0e0');
        $myLayout.panes.north.css('overflow', 'hidden');
        $myLayout.panes.south.css('overflow', 'hidden');
        $myLayout.hide("east");
    }


    function displayVisualStudioInformation() {
        var htmlArray, $visualstudio, htmlString, centerContent;
        htmlArray = [];

        updateCSS('visualstudio');

        $visualstudio = $xml.find('VisualStudio');

        $($visualstudio).find('Instance').each(function () {

            var fieldsetClass = '';
            var idString = 'ID: ' + $(this).attr('ID');
            if ($(this).attr('IsAsnaInstance') === 'true') {
                fieldsetClass = 'asnaInstance';
                idString += ' - ASNA Instance';
            };

            htmlArray.push('<fieldset class="' + fieldsetClass + '">');

            htmlArray.push('<legend>');
            htmlArray.push(idString);
            htmlArray.push('</legend>');
            htmlArray.push('<DIV>');
            htmlArray.push('<table>');
            htmlArray.push('<tr>');
            htmlArray.push('<th>');
            htmlArray.push('Nickname');
            htmlArray.push('</th>');
            htmlArray.push('<TD>');
            htmlArray.push($(this).attr('Nickname'));
            htmlArray.push('</TD>');
            htmlArray.push('</tr>');
            htmlArray.push('<tr>');
            htmlArray.push('<th>');
            htmlArray.push('State');
            htmlArray.push('</th>');
            htmlArray.push('<TD>');
            htmlArray.push($(this).attr('State'));
            htmlArray.push('</TD>');
            htmlArray.push('</tr>');
            htmlArray.push('<tr>');
            htmlArray.push('<th>');
            htmlArray.push('ProductName');
            htmlArray.push('</th>');
            htmlArray.push('<TD>');
            htmlArray.push($(this).attr('ProductName'));
            htmlArray.push('</TD>');
            htmlArray.push('</tr>');
            htmlArray.push('<tr>');
            htmlArray.push('<th>');
            htmlArray.push('Version');
            htmlArray.push('</th>');
            htmlArray.push('<TD>');
            htmlArray.push($(this).attr('Version'));
            htmlArray.push('</TD>');
            htmlArray.push('</tr>');
            htmlArray.push('<tr>');
            htmlArray.push('<th>');
            htmlArray.push('InstallPath');
            htmlArray.push('</th>');
            htmlArray.push('<TD>');
            htmlArray.push($(this).attr('InstallPath'));
            htmlArray.push('</TD>');
            htmlArray.push('</tr>');
            htmlArray.push('<tr>');
            htmlArray.push('<th>');
            htmlArray.push('Workloads');
            htmlArray.push('</th>');
            htmlArray.push('<TD>');

            $(this).find('Workload').each(function () {
                htmlArray.push($(this).attr('Name') + '<br />');
            });


            htmlArray.push('</TD>');
            htmlArray.push('</tr>');
            htmlArray.push('</table>');
            htmlArray.push('</DIV>');
            htmlArray.push('</fieldset>');
            htmlArray.push('<br />');
        });

        htmlString = htmlArray.join('');
        centerContent = document.getElementById('center');
        centerContent.innerHTML = htmlString;

        // update the layout
        resetLayout();
        $myLayout.hide("west");
        $myLayout.hide("east");
    }

    function displayFileSystem() {
        var $fileSystem, htmlArray, htmlString, center, west;

        updateCSS('tree_details');
        $fileSystem = $xml.find('FileSystem');

        if ($($fileSystem).find('File').length < 1) {
            htmlString = '<p>There are no files in the File System at this time.</p>';
            center = document.getElementById('center');
            center.innerHTML = htmlString;
            resetLayout();
            $myLayout.hide("east");
            $myLayout.hide("west");
            return;
        }

        htmlArray = [];

        htmlArray.push('<div id="quicklinks" class="clearfix">');
        htmlArray.push('<ul>');
        htmlArray.push('<li onclick="$(\'#fileTree\').jstree(\'open_all\');">');
        htmlArray.push('<a href="#">');
        htmlArray.push('Expand All');
        htmlArray.push('</a></li>');
        htmlArray.push('<li onclick="$(\'#fileTree\').jstree(\'close_all\');">');
        htmlArray.push('<a href="#">');
        htmlArray.push('Collapse All');
        htmlArray.push('</a></li>');
        htmlArray.push('</ul>');
        htmlArray.push('</div>');

        htmlArray.push('<div id="fileTree">');
        htmlArray.push(convertTreeToUL($fileSystem, 'FileSystem'));
        htmlArray.push('</div>');
        htmlString = htmlArray.join('');
        west = document.getElementById('west');
        west.innerHTML = htmlString;
        resetLayout();
        $myLayout.hide("east");
        $myLayout.panes.west.css('backgroundColor', '#e6e7ff');

        $("#fileTree")
            .jstree({
                "themes": {
                    "theme": "default",
                    "dots": false,
                    "icons": true,
                    "url": "https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/CSS/tree_details.css"
                },
                "core": {
                    "animation": 0
                },
                "plugins": ["themes", "html_data", "ui"]
            });
        $('#fileTree a').first().click();
    }

    function setupLayout() {
        $('#content').append('<div id="north" class="ui-layout-north"></div>');
        $('#content').append('<div id="south" class="ui-layout-south"></div>');
        $('#content').append('<div id="east" class="ui-layout-east"></div>');
        $('#content').append('<div id="west" class="ui-layout-west"></div>');
        $('#content').append('<div id="center" class="ui-layout-center"></div>');
        stateResetSettings = {
            applyDefaultStyles: true,
            north__slidable: false,
            north__resizable: false,
            north__closable: false,
            north__size: 30,
            north__spacing_open: 0,
            south__slidable: false,
            south__resizable: false,
            south__closable: false,
            south__size: 20,
            south__spacing_open: 0,
            east__fxName_close: "none",
            west__fxName_close: "none",
            resizeWhileDragging: true
        };
        resetLayout();
    }

    function addFooter() {
        var foot, logoDiv, logoImg, south;
        foot = document.createDocumentFragment();
        logoDiv = foot.appendChild(document.createElement('div'));
        logoDiv.id = 'logoDiv';
        logoImg = logoDiv.appendChild(document.createElement('img'));
        logoImg.src = 'https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/logo.png';
        south = document.getElementById('south');
        south.appendChild(foot);
    }

    function clearPane(pane) {
        var paneDiv = document.getElementById(pane);
        paneDiv.innerHTML = '';
    }

    function clearAllData() {
        clearPane('east');
        clearPane('west');
        clearPane('center');
    }

    function updateDisplay(menuname) {
        clearAllData();
        $('#navigation li.selected').removeClass('selected');
        $("#" + menuname).addClass('selected');
        if (menuname === 'System') {
            displaySystemInformation();
        } else if (menuname === 'Programs') {
            displayAddRemovePrograms();
        } else if (menuname === 'GAC') {
            displayGAC();
        } else if (menuname === 'Licensing') {
            displayASNALicensing();
        } else if (menuname === 'FileSystem') {
            displayFileSystem();
        } else if (menuname === 'Services') {
            displayServices();
        } else if (menuname === 'VisualStudio') {
            displayVisualStudioInformation();
        } else if (menuname === 'DotNet') {
            displayDotNetInformation();
        }
    }

    function parseXML(text) {
        var doc, parser;
        if (window.DOMParser) {
            parser = new DOMParser();
            doc = parser.parseFromString(text, "text/xml");
        } else if (window.ActiveXObject) {
            doc = new ActiveXObject("Microsoft.XMLDOM");
            doc.async = "false";
            doc.loadXML(text);
        } else {
            throw new Error("Cannot parse XML");
        }
        return doc;
    }

    function loadMenu() {
        var menuItem, menuList, htmlArray, htmlString, northDiv, i;

        menuItem = function (name, imgPath) {
            return {
                get_name: function () {
                    return name;
                },
                get_imgPath: function () {
                    return imgPath;
                },
                get_id: function () {
                    return name.replace(/\s/g, "");
                }
            };
        };

        menuList = [];
        menuList.push(menuItem('System', 'https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/system.png'));
        menuList.push(menuItem('Programs', 'https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/programs.png'));
        menuList.push(menuItem('DotNet', 'https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/dotnet.png'));
        menuList.push(menuItem('VisualStudio', 'https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/vs.png'));
        menuList.push(menuItem('GAC', 'https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/gac.png'));
        menuList.push(menuItem('Licensing', 'https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/licensing.png'));
        menuList.push(menuItem('File System', 'https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/filesystem.png'));
        menuList.push(menuItem('Services', 'https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/services.png'));

        htmlArray = [];
        htmlArray.push('<div id="navigation">');
        htmlArray.push('<ul>');

        for (i = 0; i < menuList.length; i += 1) {
            htmlArray.push('<li id=' + menuList[i].get_id() + ' onclick="UpdateDisplay(\'' + menuList[i].get_id() + '\');">');
            htmlArray.push('<a href="#"><img src="' + menuList[i].get_imgPath() + '" />');
            htmlArray.push(menuList[i].get_name());
            htmlArray.push('</a></li>');
        }

        htmlArray.push('</ul>');
        htmlArray.push('</div>');

        htmlString = htmlArray.join('');
        northDiv = document.getElementById('north');
        northDiv.innerHTML = htmlString;
    }

    function init() {
        var dataNode, xmldata, xmlDoc;
        dataNode = document.getElementById('data');
        xmldata = $.trim(dataNode.innerHTML);
        xmldata = xmldata.substring(9, xmldata.length - 3);
        xmlDoc = parseXML(xmldata);
        $xml = $(xmlDoc);
        setupLayout();
        loadMenu();
        updateDisplay('System');
        addFooter();
    }

    function displayLicenseDetails(product) {
        var $licenses, $nodeArray, $node, htmlArray, htmlString, detailsDiv;
        $licenses = $xml.find('ASNALicensing');
        $nodeArray = getNodesByAttr($licenses, 'Name', product);
        $node = $($nodeArray).get(0);
        htmlArray = [];
        htmlArray.push('<table><tbody>');
        htmlArray.push('<tr><th>Name</th><td>');
        htmlArray.push($node.attr('Name'));
        htmlArray.push('</td></tr>');
        htmlArray.push('<tr><th>CPUs</th><td>');
        htmlArray.push($node.attr('CPUs'));
        htmlArray.push('</td></tr>');
        htmlArray.push('<tr><th>Cores</th><td>');
        htmlArray.push($node.attr('Cores'));
        htmlArray.push('</td></tr>');
        htmlArray.push('<tr><th>Company</th><td>');
        htmlArray.push($node.attr('Company'));
        htmlArray.push('</td></tr>');
        htmlArray.push('<tr><th>Customer</th><td>');
        htmlArray.push($node.attr('Customer'));
        htmlArray.push('</td></tr>');
        htmlArray.push('<tr><th>Start Date</th><td>');
        htmlArray.push($node.attr('ValidFrom'));
        htmlArray.push('</td></tr>');
        htmlArray.push('<tr><th>End Date</th><td>');
        htmlArray.push($node.attr('ValidTo'));
        htmlArray.push('</td></tr>');
        htmlArray.push('<tr><th>Site</th><td>');
        htmlArray.push(($node.attr('Site') === 'True') ? 'Yes' : 'No');
        htmlArray.push('</td></tr>');
        htmlArray.push('<tr><th>Trial</th><td>');
        htmlArray.push(($node.attr('Trail') === 'True') ? 'Yes' : 'No');
        htmlArray.push('</td></tr>');
        htmlArray.push('<tr><th>Unlimited Users</th><td>');
        htmlArray.push(($node.attr('UnlimitedUsers') === 'True') ? 'Yes' : 'No');
        htmlArray.push('</td></tr>');
        htmlArray.push('<tr><th>Valid</th><td>');
        htmlArray.push(($node.attr('Valid') === 'True') ? 'Yes' : 'No');
        htmlArray.push('</td></tr>');
        htmlArray.push('<tr><th>Machine Code</th><td>');
        htmlArray.push($node.attr('MachineCode'));
        htmlArray.push('</td></tr>');
        htmlArray.push('<tr><th>Number of Users</th><td>');
        htmlArray.push($node.attr('NumberOfUsers'));
        htmlArray.push('</td></tr>');
        htmlArray.push('</tbody></table>');
        htmlString = htmlArray.join('');
        detailsDiv = document.getElementById('details');
        detailsDiv.innerHTML = htmlString;
    }

    function displayFolderDetails(path, section) {
        var $section, $nodeArray, $node, htmlArray, htmlString, origParentPath, cleanParentPath,
            $child, origPath, cleanPath, detailsDiv;
        $section = $xml.find(section);
        $nodeArray = getNodesByAttr($section, 'Path', path);
        $node = $($nodeArray).get(0);
        htmlArray = [];
        origParentPath = $node.attr('Path');
        cleanParentPath = origParentPath.replace(/\\/g, '\\\\');
        htmlArray.push('<div id="folderNavigation">');
        htmlArray.push('<div id="parentButton">');
        if (origParentPath.match(/\\/)) {
            htmlArray.push('<img src="https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/parent.png" alt="Up One" onclick="GoToParent(\'' + cleanParentPath + '\', \'' + section + '\')" />');
        } else {
            htmlArray.push('<img src="https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/root.png" alt="Root Folder" />');
        }
        htmlArray.push('</div>');
        htmlArray.push('<div id="currentPath"><p><strong>');
        htmlArray.push($node.attr('Path'));
        htmlArray.push('</strong></p></div>');
        htmlArray.push('</div>');
        htmlArray.push('<hr />');
        htmlArray.push('<ul>');
        $node.children().each(function () {
            $child = $(this);
            origPath = $child.attr('Path');
            cleanPath = origPath.replace(/\\/g, '\\\\');
            htmlArray.push('<li>');
            if ($child.get(0).nodeName === 'Folder') {
                htmlArray.push('<span ondblclick="DisplayFolderDetails(\'' + cleanPath + '\', \'' + section + '\');">');
                htmlArray.push('<img src="https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/closed.png" alt="folder" />');
                htmlArray.push($child.attr('Name'));
                htmlArray.push('</span>');
            } else {
                htmlArray.push('<span ondblclick="DisplayFileDetails(\'' + cleanPath + '\', \'' + section + '\');">');
                htmlArray.push('<img src="https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/file.png" alt="folder" />');
                htmlArray.push($child.attr('Name'));
                htmlArray.push('</span>');
            }
            htmlArray.push('</li>');
        });
        htmlArray.push('</ul>');
        htmlString = htmlArray.join('');
        detailsDiv = document.getElementById('center');
        detailsDiv.innerHTML = htmlString;
    }

    function displayFileDetails(path, section) {
        var $section, $nodeArray, $node, htmlArray, htmlString, origParentPath,
            cleanParentPath, detailsDiv;
        $section = $xml.find(section);
        $nodeArray = getNodesByAttr($section, 'Path', path);
        $node = $($nodeArray).get(0);
        htmlArray = [];
        origParentPath = $node.attr('Path');
        cleanParentPath = origParentPath.replace(/\\/g, '\\\\');
        htmlArray.push('<div id="folderNavigation">');
        htmlArray.push('<div id="parentButton">');
        if (origParentPath.match(/\\/)) {
            htmlArray.push('<img src="https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/parent.png" alt="Up One" onclick="GoToParent(\'' + cleanParentPath + '\', \'' + section + '\')" />');
        } else {
            htmlArray.push('<img src="https://cdn.jsdelivr.net/gh/asnaqsys/asna-inspector-web-content/Images/root.png" alt="Root Folder" />');
        }
        htmlArray.push('</div>');
        htmlArray.push('<div id="currentPath"><p><strong>');
        htmlArray.push($node.attr('Path'));
        htmlArray.push('</strong></p></div>');
        htmlArray.push('</div>');
        htmlArray.push('<hr />');
        htmlArray.push('<p><strong>');
        htmlArray.push($node.attr('Name'));
        htmlArray.push('</strong></p>');
        htmlArray.push('<table><tbody>');
        htmlArray.push('<tr>');
        htmlArray.push('<th>Assembly Version</th>');
        htmlArray.push('<td>');
        htmlArray.push($node.attr('AssemblyVersion'));
        htmlArray.push('</td>');
        htmlArray.push('<tr>');
        htmlArray.push('<tr>');
        htmlArray.push('<th>Product Version</th>');
        htmlArray.push('<td>');
        htmlArray.push($node.attr('ProductVersion'));
        htmlArray.push('</td>');
        htmlArray.push('<tr>');
        htmlArray.push('<tr>');
        htmlArray.push('<th>File Version</th>');
        htmlArray.push('<td>');
        htmlArray.push($node.attr('FileVersion'));
        htmlArray.push('</td>');
        htmlArray.push('<tr>');
        htmlArray.push('<tr>');
        htmlArray.push('<th>File Path</th>');
        htmlArray.push('<td>');
        htmlArray.push($node.attr('Path'));
        htmlArray.push('</td>');
        htmlArray.push('<tr>');
        htmlArray.push('</tbody></table>');
        htmlString = htmlArray.join('');
        detailsDiv = document.getElementById('center');
        detailsDiv.innerHTML = htmlString;
    }

    function displayServices() {
        updateCSS('arp');
        var $programs, htmlArray, htmlString, centerContent;
        $programs = $xml.find('Services');
        htmlArray = [];
        htmlArray.push('<DIV id="arpheader" class="header tableWrapper">');
        htmlArray.push('<TABLE width="100%" cellspacing="0">');
        htmlArray.push('<COL class="c1">');
        htmlArray.push('<COL class="c2">');
        htmlArray.push('<TR>');
        htmlArray.push('<TD class="c1">Name</TD>');
        htmlArray.push('<TD class="c2">Status</TD>');
        htmlArray.push('</TR>');
        htmlArray.push('</TABLE>');
        htmlArray.push('</DIV>');
        htmlArray.push('<DIV id="arpbody" class="tableData tableWrapper">');
        htmlArray.push('<DIV class="innerWrapper">');
        htmlArray.push('<TABLE width="100%" cellspacing="0">');
        htmlArray.push('<COL class="c1">');
        htmlArray.push('<COL class="c2">');
        $($programs).find('Service').each(function () {
            htmlArray.push('<tr>');
            htmlArray.push('<td><span>');
            htmlArray.push($(this).attr('Name'));
            htmlArray.push('</span></td>');
            htmlArray.push('<td>');
            htmlArray.push($(this).attr('Status'));
            htmlArray.push('</td>');
            htmlArray.push('</tr>');
        });
        htmlArray.push('</TABLE>');
        htmlArray.push('</DIV>');
        htmlArray.push('</DIV>');
        htmlString = htmlArray.join('');
        centerContent = document.getElementById('center');
        centerContent.innerHTML = htmlString;

        stripeRows('.tableData table', 'alt'); // add table-row-striping
        $('div.header, div.footer').css('paddingRight', $.layout.scrollbarWidth() + 'px');
        // update the layout
        resetLayout();
        $myLayout.panes.north.css('backgroundColor', '#e0e0e0');
        $myLayout.panes.north.css('overflow', 'hidden');
        $myLayout.panes.south.css('overflow', 'hidden');
        $myLayout.hide("west");
        $myLayout.hide("east");
    }

    function goToParent(path, section) {
        var $section, $nodeArray, $node, $parent;
        $section = $xml.find(section);
        $nodeArray = getNodesByAttr($section, 'Path', path);
        $node = $($nodeArray).get(0);
        $parent = $node.parent();
        displayFolderDetails($parent.attr('Path'), section);
    }

    return {
        Initialize: function () {
            init();
        },
        UpdateDisplay: function (menuname) {
            updateDisplay(menuname);
        },
        DisplayLicenseDetails: function (product) {
            displayLicenseDetails(product);
        },
        DisplayFolderDetails: function (path, section) {
            displayFolderDetails(path, section);
        },
        DisplayFileDetails: function (path, section) {
            displayFileDetails(path, section);
        },
        GoToParent: function (path, section) {
            goToParent(path, section);
        }
    };
}());


var formatterObj = ASNA.ForensicsPage;

$(document).ready(function () {
    "use strict";
    formatterObj.Initialize();
    return true;
});

var UpdateDisplay = formatterObj.UpdateDisplay;
var DisplayLicenseDetails = formatterObj.DisplayLicenseDetails;
var DisplayFolderDetails = formatterObj.DisplayFolderDetails;
var DisplayFileDetails = formatterObj.DisplayFileDetails;
var GoToParent = formatterObj.GoToParent;
