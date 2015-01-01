// Based on this Knockout custom binding:
// https://github.com/ShilShell/Knockout.simpleSortableGrid @6a9bc9fd59
//
// Customized for Bootstrap 3.0

(function () {
    // Private function
    function getColumnsForScaffolding(data) {
        if ((typeof data.length !== 'number') || data.length === 0) {
            return [];
        }
        var columns = [];
        for (var propertyName in data[0]) {
            columns.push({ headerText: propertyName, rowText: propertyName });
        }
        return columns;
    }

    ko.sortableGrid = {
        // Defines a view model class you can use to populate a grid
        viewModel: function (configuration) {
            var self = this;

            this.data = configuration.data;
            this.currentPageIndex = ko.observable(0);
            this.pageSize = configuration.pageSize || 5;
            this.tableClass = configuration.tableClass || 'table table-striped';
            this.sortByClass = configuration.sortByClass || 'glyphicon glyphicon-sort';
            this.sortByClassAsc = configuration.sortByClassAsc || 'glyphicon glyphicon-arrow-up';
            this.sortByClassDesc = configuration.sortByClassDesc || 'glyphicon glyphicon-arrow-down';
            this.sortCaseInsensitive = configuration.sortCaseInsensitive || true;
                        
            // Call back functions for editing or removing row data
            this.beginEdit = configuration.beginEdit || undefined;
            this.beginEditClass = configuration.beginEditClass || "glyphicon glyphicon-edit";
            this.canEdit = configuration.canEdit || function() { return this.beginEdit; };

            this.remove = configuration.remove || undefined;
            this.removeClass = configuration.removeClass || "glyphicon glyphicon-remove";
            this.canRemove = configuration.canRemove || function() { return this.remove; };

            this.customAction = configuration.customAction || undefined;
            this.customActionClass = configuration.customActionClass || 'glyphicon glyphicon-th';
            this.canCustom = configuration.canCustom || function() { return this.customAction; };

            this.lastSortedColumn = ko.observable('');
            this.lastSort = ko.observable('Desc');

            // If you don't specify columns configuration, we'll use scaffolding
            this.columns = configuration.columns || getColumnsForScaffolding(ko.unwrap(this.data));

            this.itemsOnCurrentPage = ko.computed(function () {
                var startIndex = this.pageSize * this.currentPageIndex();
                return ko.unwrap(this.data).slice(startIndex, startIndex + this.pageSize);
            }, this);

            this.maxPageIndex = ko.computed(function () {
                return Math.ceil(ko.unwrap(this.data).length / this.pageSize) - 1;
            }, this);

            this.sortBy = function (columnName) {
                if (self.lastSortedColumn() !== columnName) {
                    self.sortByAsc(columnName);
                    self.lastSortedColumn(columnName);
                    self.lastSort('Asc');
                } else if (self.lastSort() === 'Asc') {
                    self.sortByDesc(columnName);
                    self.lastSort('Desc');
                } else {
                    self.sortByAsc(columnName);
                    self.lastSort('Asc');
                }
                self.currentPageIndex(0);
            };

            this.sortComparison = function(columnName) {
                // Extract data in the various ways it might be nested or encapsulated
                return function(a, b) {
                    var val_a, val_b;
                    if (typeof columnName === "function") {
                        val_a = columnName(a);
                        val_b = columnName(b);
                    } else {
                        val_a = a[columnName];
                        val_b = b[columnName];
                    }

                    if (typeof val_a == "function") {
                        val_a = val_a();
                        val_b = val_b();
                    }

                    if (self.sortCaseInsensitive) {
                        return val_a.toLowerCase() < val_b.toLowerCase() ? -1 : 1;
                    } else {
                        return val_a < val_b ? -1 : 1;
                    }
                };
            };

            this.sortByAsc = function (columnName) {
                self.data.sort(this.sortComparison(columnName));
            };

            this.sortByDesc = function (columnName) {
                self.data.reverse(this.sortComparison(columnName));
            };

            this.sortByCSS = function (columnName) {
                if (columnName !== undefined && columnName !== '') {
                    return self.lastSortedColumn() === columnName ? (self.lastSort() === 'Asc' ? self.sortByClassAsc : self.sortByClassDesc) : self.sortByClass;
                } else {
                    return '';
                }
            };
        }
    };

    // Templates used to render the grid
    var templateEngine = new ko.nativeTemplateEngine();

    templateEngine.addTemplate = function (templateName, templateMarkup) {
        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
    };

    templateEngine.addTemplate("ko_sortableGrid_grid", "\
                    <table data-bind=\"css: tableClass\">\
                        <thead>\
                            <tr>\
                                <!-- ko foreach: columns -->\
                                    <!-- ko if: isSortable == true-->\
                                    <th data-bind=\"click: function(){$parent.sortBy($data.rowText)}\"><span data-bind=\"text: headerText\"></span>  <span data-bind=\"css:$parent.sortByCSS($data.rowText)\"></span></th>\
                                    <!-- /ko -->\
                                    <!-- ko ifnot: isSortable == true-->\
                                    <th><span data-bind=\"text: headerText\"></span></th>\
                                    <!-- /ko -->\
                                <!-- /ko -->\
                                <!-- ko if: canEdit() || canRemove() || canCustom() -->\
                                    <th>Actions</th>\
                                <!-- /ko -->\
                                </tr>\
                        </thead>\
                        <tbody data-bind=\"foreach: itemsOnCurrentPage\">\
                           <tr>\
                               <!-- ko foreach: $parent.columns -->\
                                   <td data-bind=\"text: typeof rowText == 'function' ? rowText($parent) : $parent[rowText], css: typeof rowClass !== 'undefined' ? rowClass : '' \"></td>\
                               <!-- /ko -->\
                               <!-- ko if: $parent.canEdit() || $parent.canRemove() || $parent.canCustom() -->\
                                   <td class=\"col-md-1\">\
                                       <div class=\"btn-group btn-group-xs\" role=\"group\" aria-label=\"Actions\">\
                                           <!-- ko if: $parent.customAction -->\
                                           <button data-bind=\"click: $parent.customAction\" type=\"button\" class=\"btn btn-default\"><span data-bind=\"css: $parent.customActionClass\"></span></button>\
                                           <!-- /ko -->\
                                           <!-- ko if: $parent.beginEdit -->\
                                           <button data-bind=\"click: $parent.beginEdit\" type=\"button\" class=\"btn btn-default\"><span data-bind=\"css: $parent.beginEditClass\"></span></button>\
                                           <!-- /ko -->\
                                           <!-- ko if: $parent.remove -->\
                                           <button data-bind=\"click: $parent.remove\" type=\"button\" class=\"btn btn-default\"><span data-bind=\"css: $parent.removeClass\"></span></button>\
                                           <!-- /ko -->\
                                       </div>\
                                   </td>\
                               <!-- /ko -->\
                            </tr>\
                        </tbody>\
                    </table>");

    templateEngine.addTemplate("ko_sortableGrid_pageLinks", "\
                    <div>\
                        <ul class=\"pagination\">\
                        <li data-bind=\"css: {disabled: $root.currentPageIndex() === 0}\">\
                            <a data-bind=\"click: function() { if ($root.currentPageIndex() > 0) $root.currentPageIndex($root.currentPageIndex()-1) }\" href=\"#\"><span aria-hidden=\"true\">&laquo;</span><span class=\"sr-only\">Previous</span></a>\
                        </li>\
                        <!-- ko foreach: ko.utils.range(0, maxPageIndex) -->\
                            <li data-bind=\"css: { active: $data === $root.currentPageIndex() }\"><a href=\"#\" data-bind=\"text: $data + 1, click: function() { $root.currentPageIndex($data) }\">\
                            </a></li>\
                        <!-- /ko -->\
                        <li data-bind=\"css: {disabled: $root.currentPageIndex() === maxPageIndex()}\">\
                            <a data-bind=\"click: function() { if ($root.currentPageIndex() < maxPageIndex()) $root.currentPageIndex($root.currentPageIndex()+1) }\" href=\"#\"><span aria-hidden=\"true\">&raquo;</span><span class=\"sr-only\">Next</span></a>\
                        </li>\
                        </ul>\
                    </div>");

    // The "sortableGrid" binding
    ko.bindingHandlers.sortableGrid = {
        init: function () {
            return { 'controlsDescendantBindings': true };
        },
        // This method is called to initialize the node, and will also be called again if you change what the grid is bound to
        update: function (element, viewModelAccessor, allBindings) {
            var viewModel = viewModelAccessor();

            // Empty the element
            while (element.firstChild)
                ko.removeNode(element.firstChild);

            // Allow the default templates to be overridden
            var gridTemplateName = allBindings.get('sortableGridTemplate') || "ko_sortableGrid_grid",
                pageLinksTemplateName = allBindings.get('sortableGridPagerTemplate') || "ko_sortableGrid_pageLinks";

            // Render the main grid
            var gridContainer = element.appendChild(document.createElement("DIV"));
            ko.renderTemplate(gridTemplateName, viewModel, { templateEngine: templateEngine }, gridContainer, "replaceNode");

            // Render the page links
            var pageLinksContainer = element.appendChild(document.createElement("DIV"));
            ko.renderTemplate(pageLinksTemplateName, viewModel, { templateEngine: templateEngine }, pageLinksContainer, "replaceNode");
        }
    };
})();
