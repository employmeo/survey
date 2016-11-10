//
// Survey REST Service API Calls
//


function getRespondant(uuId) {
    $.ajax({
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
    $.ajax({
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
    $.ajax({
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
        	readyPage();
        },
        error: function(data) {showError(data);}
    });
}

function getAccountSurvey(asid) {
    $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'survey/' + asid,
        success: function(data) {
        	survey = data;
        	$('#wait').addClass('hidden');
            createNewRespondantForm();
        },
        error: function(data) { showError(data); }
    });
}

function getRespondantSurvey(uuId) {
    $.ajax({
        type: "GET",
        async: true,
        url: servicePath + 'respondant/' + uuId + '/getsurvey',
        success: function(data) { survey = data; readyPage()},
        error: function(data) { showError(data); }
    });
}

function getResponses(uuId) {
    $.ajax({
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
        	readyPage();
        },
        error: function(data) { responses = new Array(); }
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
	var submission = {}
	submission.uuid = respondant.respondantUuid;
    $.ajax({
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