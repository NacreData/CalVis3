/**
 * Copyright 2008 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview This file contains the core implementation for CalVis.
 * @author eamonnlinehan@gmail.com (Eamonn Linehan)
 * @author api.austin@google.com (Austin Chau)
 */

// Namespace to protect this library from conflicting with external
var calvis = calvis || {};

// Constant strings for month labels
calvis.MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 
    'Oct', 'Nov', 'Dec'];

// Constant strings for day labels
calvis.DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// CSS IDs
calvis.monthViewButtonId = 'monthViewButton';
calvis.weekViewButtonId = 'weekViewButton';
calvis.todayButtonId = 'todayButton';
calvis.prevWeekButtonId = 'prevWeek';
calvis.nextWeekButtonId = 'nextWeek';
calvis.prevMonthButtonId = 'prevMonth';
calvis.nextMonthButtonId = 'nextMonth';
calvis.yearChooserId = 'yearChooser';
calvis.weekDurationId = 'weekDuration';
calvis.yearHolderId = 'yearHolder';
calvis.monthHolderId = 'monthHolder';
calvis.loginLinkId = 'loginLink';

// CSS classes
calvis.columnHeadingClass = 'columnHeading';
calvis.weekViewCellClass = 'weekViewCell';
calvis.monthViewCellClass = 'monthViewCell';
calvis.contentCellClass = 'contentCell';
calvis.eventClass = 'eventItem';

// string labels
calvis.AppStringLabel = 'Generic-Calendar-Container-1.0';
calvis.loginLabel = 'Log in';
calvis.logoutLabel = 'Log out';
calvis.monthViewButtonLabel = 'Month';
calvis.weekViewButtonLabel = 'Week';
calvis.todayButtonLabel = 'Today';
calvis.prevWeekButtonLabel = '<<';
calvis.nextWeekButtonLabel = '>>';
calvis.prevMonthButtonLabel = '<<';
calvis.nextMonthButtonLabel = '>>';
calvis.loadingLabel = ' loading... ';
calvis.moreLabel = 'more';

/**
 * Constructor to create an instance of the Calendar Container
 */   
calvis.Calendar = function() {  

  // Fix quarks for IE
  calvis.fixIE();
  
  // Create an instance of the Google Data service object
  this.calendarService = 
      new google.gdata.calendar.CalendarService(calvis.AppStringLabel);
  
  // CSS IDs to position key container components
  this.calendarBodyId = null;
  this.navControlId = null;
  this.viewControlId = null;
  this.loginControlId = null;
  this.statusControlId = null;
  this.eventDisplayId = null;

  // The callback method to be invoked when event is triggered to be displayed
  this.eventCallback = null;

  // The calendar ID(s) to be displayed from this container
  this.calIds = null;

  // The visibility of this calendar, private or public
  this.visibility = null;
  
  // The pivot date for the current navigation view
  this.currentPivotDate = new Date();

  // The current view mode of the container
  this.currentViewMode = null;
  
  //Cache todays date
  this.currentDateCellID = [new Date().getFullYear(), 
                           calvis.padZero(new Date().getMonth() + 1), 
                           calvis.padZero(new Date().getDate())].join('');
};

/**
 * Set the CSS ID for the calendar body.  Calendar body is the grid that
 * represents where the date cells are contained.
 * @param {string} cssId The CSS ID of the calendar body.
 */   
calvis.Calendar.prototype.setCalendarBody = function(cssId) {
  this.calendarBodyId = cssId;
};

/**
 * Set the CSS ID for the navigation control.  Navgivation control allows the
 * user to navigate through the calendar
 * @param {string} cssId The CSS ID of the navigation control.
 */  
calvis.Calendar.prototype.setNavControl = function(cssId) {
  this.navControlId = cssId;
};

/**
 * Set the CSS ID for the view control.  View control allows the
 * user to switch between calendar views (month or week)
 * @param {string} cssId The CSS ID of the view control.
 */  
calvis.Calendar.prototype.setViewControl = function(cssId) {
  this.viewControlId = cssId;
};

/**
 * Set the CSS ID for the status control.  Status control is where
 * the calendar status such as "loading" or error messages are displayed
 * @param {string} cssId The CSS ID of the status control.
 */  
calvis.Calendar.prototype.setStatusControl = function(cssId) {
  this.statusControlId = cssId;
};

/**
 * Set the method that will be invoked when a trigger (click or mouseover)
 * occurs. 
 * @param {string} trigger The event that triggers the callback, can be 
 *   "click" or "mouseover"
 * @param {Function} callback This callback will be invoked when the trigger occurs. 
 *   The callback will be passed one argument of type 
 *   "google.gdata.calendar.CalendarEventEntry", documentation -
 *   http://code.google.com/apis/gdata/jsdoc/1.1/google/gdata/calendar/CalendarEventEntry.html.
 *   This callback should use this event object and access its details for display
 */  
calvis.Calendar.prototype.setEventCallback = 
    function(trigger, callback) {
  this.eventTrigger = trigger;
  this.eventCallback = callback;
};

/**
 * Set the array of Google Calendar IDs of one or more public calendars.
 * @param {string} calId The ID of a public Google Calendar.
 */  
calvis.Calendar.prototype.setPublicCalendars = function(calIds) {
  this.visibility = 'public';
  this.calIds = calIds;
};

/**
 * This method should be called after all the CSS IDs and other properties
 * are set and ready to be displayed. 
 */ 
calvis.Calendar.prototype.render = function() {

  var calendar = this;

  calendar.createFittingSpan();

  // global init

  // default view is month view
  calendar.initViewControl();
  
  if (!calendar.currentViewMode) {
    calendar.setDefaultView('month');
  }

  calendar.currentViewMode();

};  

/**
 * Set the default view for CalVis initial rendering.
 * @param {string} view The View setting, either "month" or "week".
 */  
calvis.Calendar.prototype.setDefaultView = function(view) {
  switch(view) {
    case 'week':
      this.currentViewMode = this.initWeekView;
      break;
    case 'month':
      this.currentViewMode = this.initMonthView;
      break;
  }
};

/**
 * Retrieve the feed URL(s) that will be used for token request 
 * and also for data request of your calendar(s).
 */ 
calvis.Calendar.prototype.getFeedUrls = function() {
  var feedUrlArray = new Array();
  calIds = this.calIds;
  for( var i=0; i<calIds.length; i++ ) {
    feedUrlArray[i] = ['http://www.google.com/calendar/feeds/', calIds[i],
      '/public/full'].join('');
  }
  return feedUrlArray;
};

/**
 * Initialize the view control.
 */ 
calvis.Calendar.prototype.initViewControl = function() {

  var calendar = this;

  var viewControlHtml = [];

  viewControlHtml.push('<input type="button" id="');
  viewControlHtml.push(calvis.weekViewButtonId);
  viewControlHtml.push('" value="');
  viewControlHtml.push(calvis.weekViewButtonLabel);
  viewControlHtml.push('">');

  viewControlHtml.push('&nbsp;');
  
  viewControlHtml.push('<input type="button" id="');
  viewControlHtml.push(calvis.monthViewButtonId);
  viewControlHtml.push('" value="');
  viewControlHtml.push(calvis.monthViewButtonLabel);
  viewControlHtml.push('">');
  
  jQuery('#' + this.viewControlId).empty();
  jQuery('#' + this.viewControlId).html(viewControlHtml.join(''));

  // append click handler to view control buttons

  jQuery('#' + calvis.monthViewButtonId).click(function() {
    calendar.currentViewMode = calendar.initMonthView;
    calendar.currentViewMode();    
  });

  jQuery('#' + calvis.weekViewButtonId).click(function() {
    calendar.currentViewMode = calendar.initWeekView;
    calendar.currentViewMode();
  });

};

/**
 * Update the week duration display of the Navigation control.
 */ 
calvis.Calendar.prototype.updateWeekDuration = function() {
  var weekStart = calvis.getFirstDateOfWeek(this.currentPivotDate);
  var weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  var durationString = [];
  
  durationString.push(calvis.monthString(weekStart.getMonth()));
  durationString.push(' ');
  durationString.push(weekStart.getDate());
  durationString.push(' - ');
  durationString.push(calvis.monthString(weekEnd.getMonth()));
  durationString.push(' ');
  durationString.push(weekEnd.getDate());  
  durationString.push(' ');
  durationString.push(weekEnd.getFullYear());  
  
  jQuery('#' + calvis.weekDurationId).empty()
  jQuery('#' + calvis.weekDurationId).html(durationString.join(''));
};

/**
 * Initialize week view.
 */ 
calvis.Calendar.prototype.initWeekView = function() {      
  this.initWeekNavControl();
  this.updateWeekView();
};

/**
 * Initialize week view navigation control.
 */ 
calvis.Calendar.prototype.initWeekNavControl = function() {

  var calendar = this;

  var navControlHtml = [];

  navControlHtml.push('<input type="button" id="');
  navControlHtml.push(calvis.todayButtonId);
  navControlHtml.push('" value="');
  navControlHtml.push(calvis.todayButtonLabel);
  navControlHtml.push('"/>');

  navControlHtml.push('&nbsp;');   
  
  navControlHtml.push('<input type="button" id="');
  navControlHtml.push(calvis.prevWeekButtonId);
  navControlHtml.push('" value="');
  navControlHtml.push(calvis.prevWeekButtonLabel);
  navControlHtml.push('"/>');

  navControlHtml.push('&nbsp;');

  navControlHtml.push('<span id="');
  navControlHtml.push(calvis.weekDurationId);
  navControlHtml.push('"></span>');

  navControlHtml.push('&nbsp;');

  navControlHtml.push('<input type="button" id="');
  navControlHtml.push(calvis.nextWeekButtonId);
  navControlHtml.push('" value="');
  navControlHtml.push(calvis.nextWeekButtonLabel);
  navControlHtml.push('"/>');

  jQuery('#' + calendar.navControlId).empty();
  jQuery('#' + calendar.navControlId).html(navControlHtml.join(''));

  calendar.updateWeekDuration();

  jQuery('#' + calvis.todayButtonId).click(function() {      
    calendar.currentPivotDate = new Date();
    calendar.currentViewMode();
  });

  jQuery('#' + calvis.prevWeekButtonId).click(function() {      
    calendar.currentPivotDate.setDate(calendar.currentPivotDate.getDate() - 7);     
    calendar.updateWeekView();
  });

  jQuery('#' + calvis.nextWeekButtonId).click(function() {
    calendar.currentPivotDate.setDate(calendar.currentPivotDate.getDate() + 7);
    calendar.updateWeekView();
  });
};

/**
 * Update the current week view base on the current pivot date.
 */ 
calvis.Calendar.prototype.updateWeekView = function() {

  this.updateWeekDuration();

  var firstDate = calvis.getFirstDateOfWeek(this.currentPivotDate);

  var lastDate = new Date(firstDate);
  lastDate.setDate(firstDate.getDate() + 6);

  var weekViewHtml = [];

  weekViewHtml.push('<table style="border-collapse: separate;">');

  weekViewHtml.push('<tr>');

  var dateHolder = new Date(firstDate);

  for (var i = 0; i < 7; i++) {

    var weekDateHeading = [dateHolder.getFullYear(), '-', 
        calvis.padZero(dateHolder.getMonth() + 1), '-', 
        calvis.padZero(dateHolder.getDate())].join('');

    var weekDateHeading = [];

    weekDateHeading.push(calvis.dayString(dateHolder.getDay()));
    weekDateHeading.push(' ');
    weekDateHeading.push(dateHolder.getMonth() + 1);
    weekDateHeading.push('/');
    weekDateHeading.push(dateHolder.getDate());


    weekViewHtml.push('<td class="');
    weekViewHtml.push(calvis.columnHeadingClass);
    weekViewHtml.push('">');
    weekViewHtml.push(weekDateHeading.join(''));
    weekViewHtml.push('</td>');      

    dateHolder.setDate(dateHolder.getDate() + 1);
  }
  weekViewHtml.push('</tr>');

  var dateHolder = new Date(firstDate);

  weekViewHtml.push('<tr>');
  for (var i = 0; i < 7; i++) {
    var dateCellId = [dateHolder.getFullYear(), 
        calvis.padZero(dateHolder.getMonth() + 1), 
        calvis.padZero(dateHolder.getDate())].join('');
    var dateContentId = ['content', dateHolder.getFullYear(), 
        calvis.padZero(dateHolder.getMonth() + 1), 
        calvis.padZero(dateHolder.getDate())].join('');

    weekViewHtml.push('<td>');

    var dateHtml = [];
    dateHtml.push('<div class="');
    
    // add a class to todays date cell
    if (dateCellId == this.currentDateCellID) dateHtml.push(calvis.weekViewCellClass + ' today');
    else dateHtml.push(calvis.weekViewCellClass);
    
    dateHtml.push('" id=');
    dateHtml.push(dateCellId);
    dateHtml.push('>');
    //dateHtml.push(calvis.dayString(i));

    dateHtml.push('<div class="');
    dateHtml.push(calvis.contentCellClass);
    dateHtml.push('" id=');
    dateHtml.push(dateContentId);
    dateHtml.push('>');
    dateHtml.push('</div>');      
    dateHtml.push('</div>');
    
    weekViewHtml.push(dateHtml.join(''));

    weekViewHtml.push('</td>');
    
    dateHolder.setDate(dateHolder.getDate() + 1);
  }

  weekViewHtml.push('</tr>');
  weekViewHtml.push('</table>');
 
  jQuery('#' + this.calendarBodyId).empty();
  jQuery('#' + this.calendarBodyId).html(weekViewHtml.join(''));

  var feedUriArray = this.getFeedUrls();
  calendar = this;
  for( var i=0; i<feedUriArray.length; i++ ) {
    calendar.overlayGData( firstDate, lastDate, feedUriArray[i], i );
  }
};

calvis.Calendar.prototype.setYearChooser = function(year) {

  var options =  jQuery('#' + calvis.yearChooserId).get(0).options;    

  for (var i = 0; i < options.length ; i++) {
    var option = options[i];
    
    if (option.value == year) {
      jQuery('#' + calvis.yearChooserId).get(0).selectedIndex = i;
      break;
    }
  }
};

/**
 * Populate the options for year chooser of month view.
 */ 
calvis.Calendar.prototype.createYearChooser = function() {
  
  var calendar = this;

  var year = 2000;
  var html = [];

  html.push('<select id="');
  html.push(calvis.yearChooserId);
  html.push('">');

  for (var i = 0; i < 20; i++)
  {
    var now = new Date();  
    if (year == now.getFullYear()) {
      html.push('<option selected="yes" value="');
    } else {
      html.push('<option value="');
    }

    html.push(year);
    html.push('">');
    html.push(year);
    html.push('</option>');
    year++;
  }

  html.push('</select>');

  html = html.join('');

  var element = jQuery(html).change(function() {
    calendar.currentPivotDate.setFullYear(
        $(this).get(0).options[$(this).get(0).selectedIndex].value);
    calendar.updateMonthView();
  });

  return element;
};

/**
 * Initialize the month view.
 */ 
calvis.Calendar.prototype.initMonthView = function() {
  this.initMonthNavControl();
  this.updateMonthView();
};

/**
 * Initialize the month view navigation control.
 */ 
calvis.Calendar.prototype.initMonthNavControl = function() {

  var calendar = this;

  var navControlHtml = [];

  navControlHtml.push('<input type="button" id="');
  navControlHtml.push(calvis.todayButtonId);
  navControlHtml.push('" value="');
  navControlHtml.push(calvis.todayButtonLabel);
  navControlHtml.push('">');

  navControlHtml.push('&nbsp;'); 
  
  navControlHtml.push('<input type="button" id="');
  navControlHtml.push(calvis.prevMonthButtonId);
  navControlHtml.push('" value="');
  navControlHtml.push(calvis.prevMonthButtonLabel);
  navControlHtml.push('">');
  
  navControlHtml.push('&nbsp;');
  
  navControlHtml.push('<span id="');
  navControlHtml.push(calvis.yearHolderId);
  navControlHtml.push('"/>');

  navControlHtml.push('&nbsp;');
  
  navControlHtml.push('<span id="');
  navControlHtml.push(calvis.monthHolderId);
  navControlHtml.push('">');
  navControlHtml.push(calvis.monthString(this.currentPivotDate.getMonth()));
  navControlHtml.push('</span>');
  
  navControlHtml.push('&nbsp;');

  navControlHtml.push('<input type="button" id="');
  navControlHtml.push(calvis.nextMonthButtonId);
  navControlHtml.push('" value="');
  navControlHtml.push(calvis.nextMonthButtonLabel);
  navControlHtml.push('">');

  jQuery('#' + calendar.navControlId).empty();
  jQuery('#' + calendar.navControlId).html(navControlHtml.join(''));

  jQuery('#' + calvis.yearHolderId).html(this.createYearChooser());

  jQuery('#' + calvis.todayButtonId).click(function() {      
    calendar.currentPivotDate = new Date();
    calendar.currentViewMode();
  });

  jQuery('#' + calvis.prevMonthButtonId).click(function() {

    var currentMonth = calendar.currentPivotDate.getMonth();
    calendar.currentPivotDate.setMonth(currentMonth - 1);
    calendar.currentPivotDate.setDate(1);                     

    calendar.updateMonthView();
  });

  jQuery('#' + calvis.nextMonthButtonId).click(function() {      
    
    var currentMonth = calendar.currentPivotDate.getMonth();
    calendar.currentPivotDate.setMonth(currentMonth + 1);
    calendar.currentPivotDate.setDate(1);

    calendar.updateMonthView();
  });
};

/**
 * Update the month view navigation control relative to the current
 * pivot date.
 */ 
calvis.Calendar.prototype.updateMonthNavControl = function() {          
  this.setYearChooser(this.currentPivotDate.getFullYear());
  jQuery('#' + calvis.monthHolderId).empty();
  jQuery('#' + calvis.monthHolderId).html(calvis.monthString(
      this.currentPivotDate.getMonth()));
};

/**
 * Initialize the month view grid.  The month view grid is the grid
 * rectangular boxes that represents the dates of a given month.
 */ 
calvis.Calendar.prototype.initMonthGrid = function() {
  var monthViewHtml = [];

  monthViewHtml.push('<table style="border-collapse: separate;">');    
  monthViewHtml.push('<tr>');
  for (var i=0; i<7; i++ )
  {
      monthViewHtml.push('<td class="');
      monthViewHtml.push(calvis.columnHeadingClass);
      monthViewHtml.push('">');

      monthViewHtml.push(calvis.dayString(i));
      monthViewHtml.push('</td>');      
  }
  monthViewHtml.push('</tr>');

  var index = 0;

  for (var i=0; i<6; i++ )
  {
    monthViewHtml.push('<tr>');
    for (var j=0; j<7 ;j++ )
    {
      monthViewHtml.push('<td id="date' + index + '">');
      // monthViewHtml.push('&nbsp;'); Allow empty rows to collapse
      monthViewHtml.push('</td>');
      index++;
    }
    monthViewHtml.push('</tr>');
  }

  monthViewHtml.push('</table>');

  jQuery('#' + this.calendarBodyId).empty();
  jQuery('#' + this.calendarBodyId).html(monthViewHtml.join(''));
};

/**
 * Update month view relative to the current pivot date.
 */ 
calvis.Calendar.prototype.updateMonthView = function() {

  this.initMonthGrid();
  this.updateMonthNavControl();

  // fill the month dates 

  var firstDate = (new Date(this.currentPivotDate));
  firstDate.setDate(1);

  var daysInMonth = calvis.getDaysInMonth(firstDate);
  
  var dateHolder = new Date(firstDate);

  var startIndex = firstDate.getDay();      

  for (var i = 0; i < daysInMonth; i++ ) {

    var dateCellId = [dateHolder.getFullYear(), 
        calvis.padZero(dateHolder.getMonth() + 1), 
        calvis.padZero(dateHolder.getDate())].join('');
    var dateContentId = ['content', dateHolder.getFullYear(), 
        calvis.padZero(dateHolder.getMonth() + 1), 
        calvis.padZero(dateHolder.getDate())].join('');

    var dateHtml = [];

    dateHtml.push('<div class="');
    
    // add a class to todays date cell
    if (dateCellId == this.currentDateCellID) dateHtml.push(calvis.monthViewCellClass + ' today');
    else dateHtml.push(calvis.monthViewCellClass);

    dateHtml.push('" id=');
    dateHtml.push(dateCellId);
    dateHtml.push('>');

    dateHtml.push('<div class="');
    dateHtml.push(calvis.contentCellClass);
    dateHtml.push('" id=');
    dateHtml.push(dateContentId);
    dateHtml.push('>');
    
    dateHtml.push(dateHolder.getDate());

    dateHtml.push('</div>');      
    dateHtml.push('</div>');
    
    jQuery('#date' + startIndex).html(dateHtml.join(''));

    dateHolder.setDate(dateHolder.getDate() + 1);
    startIndex++;
  }  

  var lastDate = new Date(firstDate);
  lastDate.setDate(daysInMonth);

  var feedUriArray = this.getFeedUrls();
  calendar = this;
  for( var i=0; i<feedUriArray.length; i++ ) {
    calendar.overlayGData( firstDate, lastDate, feedUriArray[i], i );
  }

};

/**
 * This is an internal callback that is invoked when the
 * JavaScript client library returns the event data.  It will
 * then display the event title on its corresponding date cell.
 * @param {string} id The date cell.
 * @param {google.gdata.calendar.CalendarEventEntry}  A Google Data calendar event object.
 * @param {string} label A div ID identifying so that each calendar may have a different style attached to its events 
 *  
 */ 
calvis.Calendar.prototype.appendEvent = function(id, event, label) {
  var eventTime = /T(\d\d):(\d\d)/.exec( event.gd$when[0].startTime );

  var eTime     = '';
  if( eventTime ) {
    if( eventTime[1] > 12 ) {
      eTime = (eventTime[1]-12);
      if( '00' != eventTime[2] ) {
        eTime += ':' + eventTime[2] + 'p ';
      }
      else {
        eTime += 'p ';
      }
    }
    else {
      eTime = eventTime[1];
      if( '00' != eventTime[2] ) {
        eTime += ':' + eventTime[2] + ' ';
      }
      else {
        eTime += ' ';
      }
    }
  }
  
  var calendar = this;

  var title = event.getTitle().getText();    
  var eventId = event.getId().getValue();

  var cell = jQuery('#' + id);

  // special case, this is a date element that doesn't exist in the current 
  // view.  This is most likely that an event that spans across 
  // two months.  This script currently doesn't handle multi-day events yet.
  if (cell.length == 0) {
    return;
  }
  var cellHeight = cell.parent().height();
  var cellWidth = cell.width();
  var contentFontHeight = parseInt(cell.css('font-size'));

  var currentContentHeight = cell.height();
  
  var bottomMargin = 5;

  if (cellHeight < currentContentHeight + contentFontHeight + bottomMargin) {
    if (cell.get(0).lastChild != null && cell.get(0).lastChild.innerHTML == calvis.moreLabel) {
      // Can return right away, there is already a "more" link
      return;
    }
    
    jQuery(cell.get(0).lastChild).empty();
    jQuery(cell.get(0).lastChild).remove();

    var moreHtml = [];
    moreHtml.push('<div align="right" class="');
    moreHtml.push(calvis.eventClass + ' more');
    moreHtml.push('">');
    moreHtml.push(calvis.moreLabel);
    moreHtml.push('</div>');

    var moreDiv = jQuery(moreHtml.join(''));

    moreDiv.bind('click', function() {
      calendar.currentPivotDate = event.getTimes()[0].getStartTime().getDate();
      calendar.currentControlView = calendar.initWeekView;
      calendar.initWeekView();
    });

    cell.append(moreDiv);    

  } else {

	  // if greater than a single day then copy into next cell
	  var times = event.getTimes();
	  for (i = 0; i < times.length; i++) {
		  
		  var days =  Math.floor(times[i].getEndTime().getDate() - times[i].getStartTime().getDate()) / (1000*60*60*24);

		  for (j = 0; j < days; j++) {
			  var date = times[i].getStartTime().getDate();
			  date.setDate(date.getDate() + j);
			    
			  var id = [];           
			  id.push('content');
			  id.push(date.getFullYear());
			  id.push(calvis.padZero(date.getMonth() + 1));
			  id.push(calvis.padZero(date.getDate()));
			  id = id.join('');
			
			  var cell = jQuery('#' + id); 
			  
			  var eventHtml = [];
			  eventHtml.push('<div id="');
			  eventHtml.push('cal' + label); // Eamonn 'eventId'
			  eventHtml.push('" class="');
			  
			  if (days > 1) {
				  if (j == 0) eventHtml.push(calvis.eventClass + ' first');
				  else if (j == days - 1) eventHtml.push(calvis.eventClass + ' last');
				  else eventHtml.push(calvis.eventClass + ' middle');
			  } else {
				  eventHtml.push(calvis.eventClass);
			  }
			  
			  eventHtml.push('">');
			  eventHtml.push(calendar.fitText('&nbsp;' + eTime + title, cellWidth));
			  eventHtml.push('</div>');
			  
			  var eventDiv = jQuery(eventHtml.join(''));
			
			  eventDiv.bind(this.eventTrigger, function() {
			    if (calendar.eventCallback) {
			      calendar.eventCallback(event);
			    } else {
			      calendar.defaultEventCallback(event);
			    }      
			  });
			  
			  cell.append(eventDiv);
		  }
	  
	  }
    
    
  }
  
};

/**
 * When the date cell is overflowed because of too many events for 
 * a particular date, a "more" link is created.
 * @param {string} id The date cell ID which this more link belongs to.
 */ 
calvis.Calendar.prototype.createMoreMenu = function(id) {

  var calendar = this;

  var moreHtml = [];

  moreHtml.push('<select id="');
  moreHtml.push(id);
  moreHtml.push('">');
  moreHtml.push('</select>');

  var moreDiv = jQuery(moreHtml.join(''));

  moreDiv.bind('change', function() {
    if (calendar.eventCallback) {
      calendar.eventCallback(event);
    } else {
      calendar.defaultEventCallback(event);
    }       
  });

  return moreDiv;
};

/**
 * This creates a dummy span that is used to calculate whether 
 * a date cell is overflowing.
 */ 
calvis.Calendar.prototype.createFittingSpan = function() {
  var span = jQuery('<span/>');
  span.addClass(calvis.contentCellClass);
  span.css({'visibility': 'hidden'});
  jQuery(document.body).append(span);
  this.fittingSpan = span;
};

/**
 * This method overlays the event data between two dates and append
 * these events on their appropriate date cells.
 * @param {Date} startDate The start date that will be used for data query.
 * @param {Date} endDate The end date that will be used for data query.
 * @param {string} label An identifer used to style events per calendar
 */ 
calvis.Calendar.prototype.overlayGData = function(startDate, endDate, feedUri, label) {
  
  var calendar = this;

  // if it is a private account and doesn't have a valid token
  if (calendar.visibility == 'private' && !calendar.hasValidToken(feedUri)) {
    jQuery('#' + this.statusControlId).html(
        'you must log in to access private calendar');
    return;
  }

  endDate.setDate(endDate.getDate() + 1);

  var startDateTime = new google.gdata.DateTime(startDate, true);
  var endDateTime = new google.gdata.DateTime(endDate, true);

  var query = new google.gdata.calendar.CalendarEventQuery(feedUri);

  query.setMinimumStartTime(startDateTime);
  query.setMaximumStartTime(endDateTime);

  query.setMaxResults(500);
  query.setOrderBy('starttime');
  query.setSortOrder('a');
  query.setSingleEvents(true);

  var callback = function(root) {
    
    var eventEntries = root.feed.getEntries();
     
      for (var i = 0; i < eventEntries.length; i++) {
        var event = eventEntries[i];
        for (var j = 0; j < event.getTimes().length; j++ ) {
          var status = event.getEventStatus();

          if (status == google.gdata.EventStatus.VALUE_CANCELED)
            continue;

          var when = event.getTimes()[j];
          var datetime = when.getStartTime();
          var date = datetime.getDate();
          
          var id = [];           
          id.push('content');
          id.push(date.getFullYear());
          id.push(calvis.padZero(date.getMonth() + 1));
          id.push(calvis.padZero(date.getDate()));
          id = id.join('');

          calendar.appendEvent(id, event, label);
        }
      }
      jQuery('#' + calendar.statusControlId).html('');
  };

  jQuery('#' + calendar.statusControlId).html(calvis.loadingLabel);
  calendar.calendarService.getEventsFeed(query, callback, calvis.handleError);
};

/**
 * A helper function that gets the string representation of a day of the week
 * @param {number} offset An index between 0 and 6
 */ 
calvis.dayString = function(offset) {
  return calvis.DAYS[offset];
};

/**
 * A helper function that gets the string representation of a month of the year
 * @param {number} offset An index between 0 and 11
 */
calvis.monthString = function(offset) {
  return calvis.MONTHS[offset];
};

/**
 * A helper function that derives the number of days within a month.
 * @param {Date} pivotDate The current pivot date to locate the current month.
 */
calvis.getDaysInMonth = function(pivotDate) {
  var year = pivotDate.getFullYear();
  var month = pivotDate.getMonth();
  return 32 - (new Date(year, month, 32)).getDate();
};

/**
 * A helper function that derives the first date of a week.
 * @param {Date} pivotDate The current pivot date to locate the current week.
 */
calvis.getFirstDateOfWeek = function(pivotDate) {
  var dayOffset = pivotDate.getDay();
  return new Date(pivotDate.getFullYear(), pivotDate.getMonth(), 
      pivotDate.getDate() - dayOffset);
};

/**
 * This function fits the event title to the width of a date cell, it truncates
 * the title and replaced with "...", if necessary.
 * @param {string} text The text that is examined to fit it width to date cell.
 * @param {number} limit The maximum number of characters that is permitted.
 */
calvis.Calendar.prototype.fitText = function(text, limit) {

  this.fittingSpan.html(text);

  var currentWidth = this.fittingSpan.width();

  while (currentWidth > limit) {
    text = text.replace(/.$/, '');    
    this.fittingSpan.html(text);
    currentWidth = this.fittingSpan.width();
  }

  return text;
};

/**
 * The is the error handler that display the error message to the status control.
 * @param {Object} e The error object.
 */
calvis.handleError = function (e) {
  google.accounts.user.logout();
  jQuery('#' + calvis.loginLinkId).html(calvis.loginLabel);
  jQuery('#' + this.statusControlId).html(e.cause.statusText);
};

/**
 * Debug method that display at the token information.
 */
calvis.getTokenInfo = function() {
  google.accounts.user.getInfo(function(data) {
    console.log(data.currentTarget.responseText);
    var target = eval(data.currentTarget.responseText);
    console.log(target);
  });
};

/**
 * A helper functions that makes sure a number is represeted in two digits
 * by padding zero in front if necessary.
 * @param {number} number The number that will be padded.
 */
calvis.padZero = function(number) {
  if(number < 10) {
    number = 0 + '' + number;
  }      
  return number;
};

/**
 * This method fixes IE specific issues
 */ 
calvis.fixIE = function() {
  if (!Array.indexOf) {
    Array.prototype.indexOf = function(arg) {

      var index = -1;
      for (var i = 0; i < this.length; i++){
        var value = this[i];
        if (value == arg) {
          index = i;
          break;
        } 
      }
      return index;
    };
  }
  
  // inject "console.log" to emulate Firefox firebug.  
  // For debugging purpose
  if (!window.console) {
    window.console = {};
    window.console.log = function(message) {
      var body = document.getElementsByTagName('body')[0];
      var messageDiv = document.createElement('div');
      messageDiv.innerHTML = message;
      body.insertBefore(messageDiv, body.lastChild);
    };
  } 

};
