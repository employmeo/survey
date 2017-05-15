//
// Survey REST Service API Calls
//


function getRespondant(uuId) {
    return $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'respondant/'+uuId,
        success: function(data) { 
        	respondant = data;
        	getResponses(respondant.respondantUuid);
        },
        error: function(data) { showError(data); }
    });
}

function getRespondantByPayrollId(id, asid) {
    return $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'survey/' + asid + '/respondantbypayroll/' + id,
        success: function(data) { 
        	respondant = data;
        	getResponses(respondant.respondantUuid);
        },
        error: function(data) { showError(data); }
    });
}

function orderNewAssessment(order) {
    return $.ajax({
        type: "POST",
        async: true,
        url: servicePath + 'orderassessment',
        data: JSON.stringify(order),
        contentType: "application/json",
        headers : {
		    'Content-Type': 'application/json',
        	'charset':'UTF-8',
        	'Accept': 'application/json'
        },
        success: function(data) { 
        	respondant = data;
        	getResponses(respondant.respondantUuid);
        },
        error: function(data) {showError(data);}
    });
}

function getAccountSurvey(asid, cb) {
    return $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'survey/' + asid,
        success: cb,
        error: function(data) { showError(data); }
    });
}

function getAccountSurveyUuid(asuuid, cb) {
    return $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'survey/uuid/' + asuuid,
        success: cb,
        error: function(data) { showError(data); }
    });
}

function getLocations(asuuid) {
    return $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'survey/' + asuuid + '/locations',
        success: function (data) {
        	$.each(data, function (index, value) {
        		$('#locationId').append($('<option/>', { 
        			value: this.id,
        			text : this.locationName 
        		}));
        	});
        	$('#locationId').val(survey.account.defaultLocationId);
        },
        error: function(data) {
        	console.log(data);
        	$('#locationId').append($('<option/>', { 
        		value: survey.account.defaultLocationId,
        		text : 'Default Location'
        	}));
        }
    });
}

function getPositions(asuuid) {
    return $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'survey/' + asuuid + '/positions',
        success: function (data) {
        	$.each(data, function (index, value) {
        		$('#positionId').append($('<option/>', { 
        			value: this.id,
        			text : this.positionName 
        		}));
        	});
        	$('#positionId').val(survey.account.defaultPositionId);
        },
        error: function(data) {
        	console.log(data);
        	$('#positionId').append($('<option/>', { 
        		value: survey.account.defaultPositionId,
        		text : 'Default Position'
        	}));
        }
    });
}


function getRespondantSurvey(uuId) {
    return $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'respondant/' + uuId + '/getsurvey',
        success: function(data) { survey = data; buildSurvey()},
        error: function(data) { showError(data); }
    });
}

function getResponses(uuId) {
    return $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'response/'+uuId,
        success: function(data) {
        	// Store Responses by Question ID
        	responses = new Array();
        	if (data != null) {
        		for (var i=0;i<data.length;i++) {
        			responses[data[i].questionId] = data[i];
        		}
        	}
        	buildSurvey();
        },
        error: function(data) { responses = new Array(); }
    });
}

function checkResponses(uuId, cb) {
    return $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'response/'+uuId,
        success: function(data) {
        	// Store Responses by Question ID
        	responses = new Array();
        	if (data != null) {
        		for (var i=0;i<data.length;i++) {
        			responses[data[i].questionId] = data[i];
        		}
        	}
        	cb();
        },
        error: function(data) {}
    });
}

function sendMediaResponse(formdata) {
	$.ajax({
        type: 'POST',
        async: true,
        url: '/upload/media',
        processData: false,  // Important!
        contentType: false,
        cache: false,
        data: formdata,
        headers : {
        	'charset':'UTF-8',
        	'Accept': 'application/json'
        },
        success: function(data) { console.log(data); },
        error: function(data) { console.log(data); } // what to do here?
  });
}

function sendResponse(response, cb) {
    var method = "POST";
    if (response.id != null) method="PUT";
	$.ajax({
        type: method,
        async: true,
        url: servicePath + 'response',
        data: JSON.stringify(response),
        contentType: "application/json",
        headers : {
		    'Content-Type': 'application/json',
        	'charset':'UTF-8',
        	'Accept': 'application/json'
        },
        success: cb,
        error: function(data) { console.log(data); } // what to do here?
  });
}


function submitSurvey() {
	var redirect = respondant.redirectUrl;
	if (redirect == null) redirect = survey.redirectPage;
	if (redirect == null) redirect = '/thankyou.htm';
	var submission = {};
	submission.uuid = respondant.respondantUuid;
    return $.ajax({
        type: "POST",
        async: true,
        url: servicePath + 'submitsurvey',
        data : JSON.stringify(submission),
        contentType: "application/json",
        headers : {
		    'Content-Type': 'application/json',
        	'charset':'UTF-8',
        	'Accept': 'application/json'
        },
        success: function(data)
        {
        	if (redirect != null) {
                window.location.assign(redirect);        		
        	}
        }
      });	
}

function getGrader(uuId) {
    return $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'grader/'+uuId,
        success: function(data) { 
        	grader = data;
        },
        error: function(data) { showError(data); }
    });
    

}

function getCriteria(uuId) {
    return $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'grader/'+uuId+'/criteria',
        success: function(data) { 
        	criteria = data;
        },
        error: function(data) { showError(data); }
    });
}

function getGrades(uuId) {
    return $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'grader/'+uuId+'/grades',
        success: function(data) { 
        	grades = data;
        },
        error: function(data) { showError(data); }
    });
}

function sendGrade(response, cb) {
    var method = "POST";
    var grade = {};
    if (response.id) grade.id = response.id;
    if (response.questionId) grade.questionId = response.questionId;
    if (response.respondantId) grade.graderId = response.respondantId;
    if (response.responseValue) grade.gradeValue = response.responseValue;
    if (response.responseText) grade.gradeText = response.responseText;   
    console.log(grade);
    $.ajax({
        type: method,
        async: true,
        url: servicePath + 'grader/grade',
        data: JSON.stringify(grade),
        contentType: "application/json",
        headers : {
		    'Content-Type': 'application/json',
        	'charset':'UTF-8',
        	'Accept': 'application/json'
        },
        success: cb,
        error: function(data) { console.log(data); } // what to do here?
  });
}

function sendCallMeRequest(request, cb) {
    var method = "POST";
    $('#errorMsg').text();
    $.ajax({
        type: method,
        async: true,
        url: servicePath + 'twilio/callMe',
        data: JSON.stringify(request),
        contentType: "application/json",
        headers : {
		    'Content-Type': 'application/json',
        	'charset':'UTF-8',
        	'Accept': 'application/json'
        },
        success: cb,
        error: function(a,b,data) {
        	$('#errorMsg').text('Unable to Connect');	
        	$('#callMeButton').prop('disabled',false);
        	$('#callMeButton').text('Try Again');
        	$('#callMePhone').prop('disabled',false);
		}
  });
}

function submitGrader() {
	var redirect = 'http://www.talytica.com/';
	var submission = {};
    return $.ajax({
        type: "POST",
        async: true,
        url: servicePath + 'grader/'+grader.uuId+'/submit',
        success: function(data)
        {
        	if (redirect != null) {
                window.location.assign(redirect);        		
        	}
        }
      });	
}

function declineGrader() {
	window.location.assign(servicePath + 'grader/'+grader.uuId+'/decline');        		
}
