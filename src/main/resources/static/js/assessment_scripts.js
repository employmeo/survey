//
// Global Variables and actions for the survey page(s)
//
var urlParams;
var respondant = null;
var survey;
var activeSection;
var activeMediaQuestion;
var mediaRecorder;
var questions;
var totalpages;
var responses;
var pagination;
var progress;
var sections;
var endAt;
var timeinterval;
var grader = null;
var grades;
var criteria;
var servicePath = '/survey/1/';
var stompClient = null;

(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
})();

function enableSwiping() {
	$('#survey').on('swipeleft', function(e) { if ("INPUT" != e.target.tagName) nextPage();return false;});
	$('#survey').on('swiperight', function(e) { if ("INPUT" != e.target.tagName) prevPage();return true;});
	console.log('Swipe on!');
}

function disableSwiping() {
	$('#survey').off("swipeleft swiperight");
	console.log('Swipe off!');
}

function launchApp() {
	$('#wait').removeClass('hidden');
	$('#survey').carousel('pause');
	$('#survey').on('slid.bs.carousel',function () {window.location.hash = '#'+$('.carousel-inner div.active').attr('page-name');});
	//enableSwiping();
	if (urlParams.respondant_uuid != null) {
		getRespondant(urlParams.respondant_uuid);
	    getRespondantSurvey(urlParams.respondant_uuid);
	} else if (urlParams.asUuid != null) {
		getAccountSurveyUuid(urlParams.asUuid, function(data) {
        	survey = data;
            buildStaticLinkView();
        });
	} else if (urlParams.graderUuid) {
		$.when(getGrader(urlParams.graderUuid),
			   getCriteria(urlParams.graderUuid),
			   getGrades(urlParams.graderUuid)).done(buildGraderPreamble);

	} else if (urlParams.newgraderUuid != null) {
		setUpNewGrader(urlParams.newgraderUuid);
	} else {
		showError({"responseText" : "No ID Provided"});
	}
}

function lookupRespondant() {
    var lookup = {};
    var fields = $('#lookuprespform').serializeArray();
	for (var i=0;i<fields.length;i++) {
		lookup[fields[i].name] = fields[i].value;
	}
	getRespondantByPayrollId(lookup.id,lookup.asid);
}

function submitNewRespondant() {
	$('#wait').removeClass('hidden');
    var order = {};
	var fields = $('#newrespform').serializeArray();
	for (var i=0;i<fields.length;i++) {
		order[fields[i].name] = fields[i].value;
	}
	orderNewAssessment(order);
}

function submitNewGrader() {
	$('#wait').removeClass('hidden');
    var newGrader = {};
	var fields = $('#newgraderform').serializeArray();
	for (var i=0;i<fields.length;i++) {
		newGrader[fields[i].name] = fields[i].value;
	}
	createGrader(newGrader);
	return false;
}

function checkReferenceInput(form) {
	var qid = $(form).attr('data-questionId');
	var pagenum = $(form).attr('data-pagecount');
	var email = $('#ref_email_'+qid).val();
	var name = $('#ref_name_'+qid).val();
	var hidden = $('#hiddentext_'+qid).val();
	if (email) {
		if (!(/^.+@.+\..+$/.test(email))) {
			$('#email_group_'+qid).addClass('has-error');
		} else {
			var combined = email;
			if (name) combined = name +' <'+email+'>';
			if (combined != hidden) {
				$('#hiddentext_'+qid).val(combined);
				submitPlainAnswer(form, pagenum);
			}			
		}
	}
}

function splitReference(input) {
	var hidden = $(input).val();
	var form = input.form;
	var qid = $(form).attr('data-questionId');
	var strings = hidden.split('<');
	if (strings[1]) {
		$('#ref_email_'+qid).val(strings[1].substring(0, strings[1].length - 1));
		$('#ref_name_'+qid).val(strings[0].substring(0, strings[0].length - 1));	
	} else {
		$('#ref_email_'+qid).val(hidden);		
	}
}

function submitPlainAnswer(form, pagenum) {
	var fields = $(form).serializeArray();
	var response = {};
	for (var i=0;i<fields.length;i++) {
		response[fields[i].name] = fields[i].value;
	}
	if (respondant) {
		sendResponse(response, function(data) {
			saveResponse(data);
			isPageComplete(pagenum);
		});
	} else if(grader) {
		var criterion = getCriteriaForQid(response.questionId);
		sendGrade(criterion, response, function(data) {
			saveGrade(data);
			isPageComplete(1);
		});
	}
}

function saveGrade(grade) {
	var qid = grade.questionId;
	var priorGrade = getGradeForCriteria(qid);
	if (!priorGrade) {
		grades.push(grade);
	} else {
		var index = grades.indexOf(priorGrade);
		grades[index]=grade;
	}
    var field = '#qr' + grade.questionId;
    $(field).val(grade.id);
    var form = '#question_' + grade.questionId;
    $(form).addClass('completed');
}

function getGradeForCriteria(qid) {
	for (var i = 0; i<grades.length; i++) {
		if (qid == grades[i].questionId) return grades[i];
	}
	return null;
}

function getCriteriaForQid(qid) {
	for (var i = 0; i<criteria.length; i++) {
		if (qid ==  criteria[i].questionId) return  criteria[i];
	}
	return null;
}

// Pagination Code
function nextPage() {
	var pageType = $('.carousel-inner div.active').attr('page-type');
	var allowed = false;
	switch (pageType) {
	case "0": // Pre-amble
		allowed = true;
		break;
	case "1": // Instructions
		if (activeSection.timeSeconds > 0) {
			allowed = (endAt != null);
		} else {
			$('#progress').removeClass('hidden');	
			allowed = true;
		}
		break;
	default: // "2"=thank you "3"=questions
		allowed = isPageComplete($('.carousel-inner div.active').index() + 1);
		break;
	}
	if (allowed) {
		$('#survey').carousel("next");

		window.scrollTo(0,0);
	} else {
		// TODO - some sort of user feedback to show page is incomplete
	}
}

function prevPage() {
	var pageType = $('.carousel-inner div.active').attr('page-type');
	if (pageType == "3") {
		$('#survey').carousel("prev");
		window.scrollTo(0,0);
	} else {
		// TODO - some sort of user feedback to show can't go backwards		
	}
	
}

function isPageComplete(pagenum) {
	var complete = true;
	if(respondant) {
		var qlist = pagination[pagenum];
		for (var key in qlist ) {
			if (!qlist[key].required) continue;
			if (responses[qlist[key].questionId] == null) complete = false;
		}
	} else if(grader) {
		for (var key in criteria ) {
			if (!criteria[key].required) continue;
			if (!getGradeForCriteria(criteria[key].graderQuestionId)) complete = false;
		}
	}
	if (complete) {
		var button = '#nextbtn-' + pagenum;
		$(button).attr('disabled', false);
	}
	return complete;
}

function isSurveyComplete() {
	var complete = true;
	for (var key in questions ) {
		if (!questions[key].required) continue;
		if (responses[questions[key].question.questionId] == null) complete = false;
	}
	return complete;
}

// Error Handling Functions
function showError(data) {
	  // code to create a form to fill out for a new survey respondant	
		var deck = document.getElementById('wrapper');
		$(deck).empty();
		totalpages = 1;
		var card = $('<div />', {
			'class' : 'item active'
		});		
		card.append(getHrDiv());
		card.append($('<div />', {
			'class' : 'col-xs-12 col-sm-12 col-md-12',
			}).append($('<h3 />', { 'class' : 'text-center', 'text' : data.responseText})));
		card.append(getHrDiv());
		card.appendTo(deck);
		$('#wait').addClass('hidden');
}

function showIdNotFound(data) {
	  // code to create a form to fill out for a new survey respondant	
		var deck = document.getElementById('wrapper');
		$(deck).empty();
		totalpages = 1;
		var card = $('<div />', {
			'class' : 'item active'
		});		
		card.append(getHrDiv());
		card.append($('<div />', {
			'class' : 'col-xs-12 col-sm-12 col-md-12',
			}).append($('<h3 />', { 'class' : 'text-center', 'text' : data.responseText})));

		card.append($('<div />', {
			'class' : 'col-xs-12 col-sm-12 col-md-12 text-center',
			}).append($('<button />',{
					'type' : 'button',
					'class' : 'btn btn-primary',
					'onClick' : 'buildLookupSurvey(urlParams.benchmark);',
					'text' : 'Try Again'
			})));							
		card.append(getHrDiv());
		card.appendTo(deck);
}

// Code for automated reference check
// Grader- Reference Check Preamble Page
function buildGraderPreamble() {
	if (!grader || !criteria) {
		console.log(grader,criteria,grades);
		var data = {};
		data.responseText = 'Unable to associate this link to reference check form';
		showError(data);
		return;
	}
	$('#navtitle').text('Reference for ' + grader.respondant.person.firstName + ' ' + grader.respondant.person.lastName);
	var deck = document.getElementById('wrapper');
	$(deck).empty();
	totalpages = 1;
	
	var preambleText = '[FIRSTNAME] [LASTNAME] has requested your input on their job application. This ' +
	'short questionnaire should take less than 2 minutes to complete. To proceed, please click the ' + 
	'"Provide Input" button below. If you do not wish to provide input, please click the "decline" button.';
	if (grader.rcConfig && grader.rcConfig.preamble) preambleText = grader.rcConfig.preamble;	
	preambleText = preambleText.split('[FIRSTNAME]').join(grader.respondant.person.firstName);
	preambleText = preambleText.split('[LASTNAME]').join(grader.respondant.person.lastName);
	preambleText = preambleText.split('[ACCOUNTNAME]').join(grader.account.accountName);

	var preamble = $('<div />', {'class' : 'item active'});	
	preamble.append(getHrDiv());
	var body = $('<div />', { 'class' : 'col-xs-12' });	
	body.append($('<h3 />',{'text':'Reference for ' + grader.respondant.person.firstName + ' ' + grader.respondant.person.lastName }));
	body.append($('<p />',{'text': preambleText	}));
	preamble.append(body);
	preamble.append(getHrDiv());

	var navigation = $('<div />', {'class': 'container-fluid'});
	navigation.append($('<div />', {'class': 'col-xs-4 col-sm-4 col-md-4 text-center'}).append($('<button />', {
		'class' : 'btn btn-danger',
		'text' : "Decline",
		'onClick':'declineGrader();'
	})));
	navigation.append($('<div />', {'class': 'col-xs-4 col-sm-4 col-md-4 text-center'}));
	navigation.append($('<div />', {'class': 'col-xs-4 col-sm-4 col-md-4 text-center'}).append($('<button />', {
		'class' : 'btn btn-primary',
		'text' : "Provide Input",
		'onClick':'buildGraderForm();'
	})));
	
	preamble.append(navigation);
	preamble.appendTo(deck);
	$('#wait').addClass('hidden');
}

// Input collection page
function buildGraderForm() {
	// if "grader" or "criteria" are null, there is an issue
	var fname = grader.respondant.person.firstName;
	
	var deck = document.getElementById('wrapper');
	$(deck).empty();
	totalpages = 1;
	var card = $('<div />', {
		'class' : 'item active'
	});
	card.append(getHrDiv());
	
	for (var q=0;q<criteria.length;q++) {
		var question = criteria[q];
		question.question = criteria[q].graderQuestion;
		question.questionId = criteria[q].graderQuestionId;
		if (fname) question.question.questionText = question.question.questionText.replace('this person', fname);
		card.append(getQuestionRow(question, grader, q+1, 1));
		card.append(getHrDiv());
	}
	card.append(getSurveyNav(1,1,3));	
	card.attr('page-type',3);
	card.appendTo(deck);
	$('#wait').addClass('hidden');
	
	if (grades != null) {
		for (var i=0;i<grades.length;i++) {
			saveGrade(grades[i]);
			    if (grades[i].gradeValue) {
				    var radios =$('form[name=question_'+grades[i].questionId+
	    		    '] :input[type=radio][name=responseValue][value=' + grades[i].gradeValue + ']');
				    var checkboxes =$('form[name=question_'+grades[i].questionId+
			    		    '] :input[type=checkboxes][name=responseValue][value=' + grades[i].gradeValue + ']');
				    $(radios).prop('checked', true);
				    $(checkboxes).prop('checked', true);

				    var range = $('form[name=question_'+grades[i].questionId+'] :input[type=range][name=responseValue]');
				    var hidden =$('form[name=question_'+grades[i].questionId+'] :input[type=hidden][name=responseValue]');
				    $(range).val(grades[i].gradeValue);
				    $(hidden).val(grades[i].gradeValue);
				    $(hidden).trigger('update');
			    }
			    if (grades[i].gradeText) {
				    var textarea =$('form[name=question_'+grades[i].questionId+']').find('textarea[name=responseText]');
				    $(textarea).val(grades[i].gradeText);
				    var hidden = $('form[name=question_'+grades[i].questionId+'] :input[type=hidden][name=responseText]');
				    $(hidden).val(grades[i].gradeText);
				    $(hidden).trigger('update');
			    }

		}
		isPageComplete(1);
	}	
}
function graderConfirmation(grader) {
	$('#navtitle').text('Thank You');
	var deck = document.getElementById('wrapper');
	$(deck).empty();
	totalpages = 1;
	var card = $('<div />', {
		'class' : 'item active'
	});
	card.append(getHrDiv());			
	var preamble = $('<div />', {'class' : 'item active'});	
	preamble.append(getHrDiv());
	var body = $('<div />', { 'class' : 'col-xs-12' });	
	body.append($('<h3 />',{'class':'text-center', 'text':'We have received your submission' }));
	body.append($('<h4 />',{'class':'text-center', 'text': 'This questionnaire is complete. You may now close this browser window.' }));	
	preamble.append(body);
	preamble.append(getHrDiv());

	var navigation = $('<div />', {'class': 'container-fluid'});
	var redirect = 'https://talytica.com';
	if (grader.account.defaultRedirect) redirect = grader.account.defaultRedirect;
	if ((grader.rcConfig) && (grader.rcConfig.redirectPage)) redirect = grader.rcConfig.redirectPage;
	
	navigation.append($('<div />', {'class': 'col-xs-12 text-center'}).append($('<a />', {
		'class' : 'btn btn-primary',
		'text' : 'Ok',
		'href':redirect
	})));
	preamble.append(navigation);
	preamble.appendTo(deck);
	$('#wait').addClass('hidden');
}

//Code for building new grader page.
function buildNewGraderView(respondant) {
	// code to create a form to fill out for a new survey when no respondant present
	var deck = document.getElementById('wrapper');
	$(deck).empty();
	$(deck).load('/components/newgrader.htm', function () {
		$('#respUuid').val(respondant.respondantUuid);
		$('#respName').text(respondant.person.firstName + ' ' + respondant.person.lastName);
	});	
	$('#wait').addClass('hidden');
}

// Code for building survey pages.
function buildStaticLinkView() {
  // code to create a form to fill out for a new survey when no respondant present
	var deck = document.getElementById('wrapper');
	$(deck).empty();
	var component = survey.staticLinkView || 'newresp.htm';
	if (component.startsWith("http")) {
		$(deck).load(component, function () {
			$('#asid').val(survey.id);
		});			
	} else {
		$(deck).load('/components/'+ component, function () {
			$('#asid').val(survey.id);
		});	
	}

	$('#wait').addClass('hidden');
}

//
// Survey page building functions
//

function buildSurvey() {
	if ((responses == null) || (survey == null)) {	
		return; // wait for both function calls to complete
	}
	var deck = document.getElementById('wrapper');
	sections = survey.survey.surveySections.sort(function(a,b) {
		return a.sectionNumber < b.sectionNumber ? -1:1;
	});
	
	shuffleArray(survey.survey.surveyQuestions);
	
	questions = survey.survey.surveyQuestions.sort(function(a,b) {
		if (a.questionPage == b.questionPage) {
			return a.sequence < b.sequence ? -1:1;
		} else {
			return a.questionPage < b.questionPage ? -1:1;
	}});
		
	activeSection = null;
	// Analyze Sections to see if any are already finished
	for (var key in sections) {
		var section = sections[key];
		section.qtotal = 0;
		for (var q in questions) {
			if (questions[q].page == section.sectionNumber) section.qtotal++;
		}
		section.complete = false;
		if (section.timeSeconds > 0) {
			section.complete = isTimedSectionStarted(section.sectionNumber); // see if one answer already provided.
		} else {
			section.complete = isAllReqSectionComplete(section.sectionNumber); // see if all answers already provided.
		}
		if ((activeSection == null) && (!section.complete)) activeSection = section;
	}

	$(deck).empty();	
	getPreamble().appendTo(deck);
	if (activeSection != null) {
		buildSurveySection(deck, activeSection);
	} else {
		getThankYouPage().appendTo(deck);
	}

	// Remove wait screen
	$('#wait').addClass('hidden');
}


function isSectionAudio(section){
	var audio = false
	for (var q=0;q<questions.length;q++) {
		var question = questions[q];
		if ((question.page == section.sectionNumber) && (question.question.questionType == 16)) {
			audio = true;
			break;
		}
	}
	return audio;
}

function buildAudioSection(deck,section) {
	var pagecount = $(deck).children().length + 1; // if pre-amble then one more page for instructions
	pagination = [];
	pagination[2] = []; // hard coded 
	var pageqs = pagination[2];
	var qcount = 0;
	for (var key in questions) {
		if (questions[key].page != section.sectionNumber) continue;
		pageqs[qcount] = questions[key];
		qcount++;
	}
	totalpages = pagecount;

	var card = $('<div />', {'class' : 'questionpage item'});
	if (pagecount == 1) card.addClass('active'); // because its the only page.
	$(deck).append(card);
	$(card).load('/components/callme.htm', function() {
		card.attr('page-type',3);
		$('#callMePhone').bind('input', function (e) {
			  var x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
			  e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
		});
		if (respondant.person.phone) {
			$('#callMePhone').val(respondant.person.phone);
			$('#callMePhone').trigger('input');
		}
		$('#audioInstructions').html(section.instructions);
		$('#phoneNumber').text(survey.phoneNumber);
		$('#idnumber').text(respondant.payrollId);
		if (survey.price == 50) $('#idnumber').text(respondant.id);
	})
}

function isAudioComplete() {
	checkResponses(respondant.respondantUuid, function () {
		if (isPageComplete(2)) {
			submitSection();
		} else {
			$('#errorMsg').text('Answers Incomplete - Please Call Again');
    		$('#callMeButton').text('Try Again');	
    		$('#callMeButton').prop('disabled',false);
    		$('#callMePhone').prop('disabled',false);
    		$('#callCompleted').prop('disabled',false);
		}		
	});
}

function callMe() {
	
	$('#callMeButton').prop('disabled',true);
	$('#callMeButton').text('Dialing ...');
	$('#callMePhone').prop('disabled',true);
	var request = {
			'uuid': respondant.respondantUuid,
			'phoneNumber' : $('#callMePhone').val()
	};

	sendCallMeRequest(request, function(data) {
		$('#callMeButton').text('Connecting ...');
	    var socket = new SockJS('/stomp-calls');
	    stompClient = Stomp.over(socket);
	    stompClient.connect({}, function (frame) {
	        stompClient.subscribe('/calls/'+data.sid, function (message) {
	    	    switch (message.body) {
		    	    case 'ringing':
			    		$('#callMeButton').text(message.body);	    	    	
		    	    	break;
		    	    case 'in-progress':
		    	    	$('#errorMsg').text();
			    		$('#callMeButton').text(message.body);
			    		$('#callCompleted').prop('disabled',true);
		    	    	break;
		    	    case 'busy':
		    	    case 'failed':
		    	    case 'no-answer':
		    	    case 'canceled':
		    	    	$('#errorMsg').text('Unable to Connect');	
			    		$('#callMeButton').text('Try Again');	
			    		$('#callMeButton').prop('disabled',false);
			    		$('#callMePhone').prop('disabled',false);
			    		$('#callCompleted').prop('disabled',false);
		    	    	break;
		    	    case 'completed':
		    			$('#callMeButton').text('Completed');	    	    	
		    			isAudioComplete();
		    	    	break;
		    	    case 'queued':
		    	    default:
		    	    	break;
	    	    }
	    	    
	        });
	    });
	});
}
	

function buildSurveySection(deck, section) {
	
	if (isSectionAudio(section)) return buildAudioSection(deck,section);

	var pagecount = $(deck).children().length + 1; // starts at two, assumes pre-amble and instructions
	pagination = new Array();
	var qlimit = section.questionsPerPage; // questions per page
	totalpages = Math.ceil(section.qtotal / qlimit) + pagecount;
	
	var card = getInstructions(section, pagecount, totalpages);
	card.appendTo(deck);
	pagecount++;
	
	if (section.timeSeconds > 0) {
		updateTimer();
	} else {
		updateProgress();		
	}
	$('#progress').addClass('hidden');
	$('#timer').addClass('hidden');

	var qcount = 0;
	var qpp = 0;
	card = $('<div />', {'class' : 'questionpage item'});
	card.append(getHrDiv());
	
	if (section.topInstructions) card.append( $('<p />',{
		'class':'lead text-center',
		'style':'font-style:italic;',
		'text' : section.topInstructions
		}));
	pagination[pagecount] = new Array();
	
	for (var q=0;q<questions.length;q++) {
		var question = questions[q];
		if (question.page == section.sectionNumber) {
				qcount++;
				if (qpp == qlimit) {
					card.append(getSurveyNav(pagecount, totalpages, 5));	
					card.attr('page-type',3);
					card.attr('page-name','page_'+pagecount+'_of_'+totalpages);
					card.appendTo(deck);
					pagecount++;
					pagination[pagecount] = new Array();
					qpp = 0;
					card = $('<div />', {'class' : 'questionpage item'});
					card.append(getHrDiv());
					if (section.topInstructions) card.append( $('<p />',{
						'class':'lead text-center',
						'style':'font-style:italic;',
						'text' : section.topInstructions
						}));
				}
				var pageqs = pagination[pagecount];
				pageqs[qpp] = question;
				qpp++;
				card.append(getQuestionRow(question, respondant, qcount, pagecount));
				card.append(getHrDiv());
		}
	}
	card.append(getSurveyNav(pagecount, totalpages,3));	
	card.attr('page-type',3);
	card.appendTo(deck);		
	// Done with section questions, put in footer as "complete"
	
	if (responses != null) {
		for (var i=0;i<responses.length;i++) {
			if (responses[i] != null) {
			    saveResponse(responses[i]);
			    if (responses[i].responseValue) {
				    var radios =$('form[name=question_'+responses[i].questionId+
	    		    '] :input[type=radio][name=responseValue][value=' + responses[i].responseValue + ']');
				    var checkboxes =$('form[name=question_'+responses[i].questionId+
			    		    '] :input[type=checkboxes][name=responseValue][value=' + responses[i].responseValue + ']');
				    $(radios).prop('checked', true);
				    $(checkboxes).prop('checked', true);

				    var range = $('form[name=question_'+responses[i].questionId+'] :input[type=range][name=responseValue]');
				    var hidden =$('form[name=question_'+responses[i].questionId+'] :input[type=hidden][name=responseValue]');
				    $(range).val(responses[i].responseValue);
				    $(hidden).val(responses[i].responseValue);
				    $(hidden).trigger('update');
			    }
			    if (responses[i].responseText) {
				    var textarea =$('form[name=question_'+responses[i].questionId+']').find('textarea[name=responseText]');
				    $(textarea).val(responses[i].responseText);
				    var hidden = $('form[name=question_'+responses[i].questionId+'] :input[type=hidden][name=responseText]');
				    $(hidden).val(responses[i].responseText);
				    $(hidden).trigger('update');
			    }
			}
		}		
	}
	for (var i=1;i<=totalpages;i++) {
		isPageComplete(i);
	}
}
	
// Show Assessment Preamble
function getPreamble() {
	var preamble = $('<div />', {'class' : 'item active'});
	
	preamble.append(getHrDiv());
	preamble.append($('<div />', { 'class' : 'col-xs-12' }).html(survey.preambleText));
	preamble.append(getHrDiv());
	preamble.append(getSurveyNav(1, null, 1));	
	preamble.append(getHrDiv());
	var savelink = $('<div />', { 'class' : 'col-xs-12 form-group has-feedback'});
	savelink.append( $('<label />',{'class':'control-label','text':'"Continue Later" Link:'}));
	savelink.append( $('<input />',{
		'class' : 'form-control',
		'readonly' : true,
		'value' : window.location.origin + '/?&respondant_uuid=' + respondant.respondantUuid,
		'onClick' : 'this.focus();this.select();return false;'
	}));
	savelink.append( $('<span/>',{'class' : 'glyphicon glyphicon-bookmark form-control-feedback', 'style':'padding-right:20px;'}));
	window.history.replaceState("object or string", "Title", '/?&respondant_uuid=' + respondant.respondantUuid);
	preamble.append(savelink);
	preamble.attr('page-type',0);
	preamble.attr('page-name','instructions');
	return preamble;
}

function addBookmark(title, url) {

    alert(navigator.userAgent);
    if (window.sidebar) { // Mozilla Firefox Bookmark
        window.sidebar.addPanel(url, title, "");
    }
    else if (window.external) { // IE Favorite
        window.external.AddFavorite(url, title);
    }
    else if (window.opera && window.print) {
        alert("ASAS");
        var e = document.createElement('a');
        e.setAttribute('href', url);
        e.setAttribute('title', title);
        e.setAttribute('rel', 'sidebar');
        e.click();
    }
}


//Show Section Instructions
function getInstructions(section) {
	var instr = $('<div />', {'class' : 'item', 'id' : 'instructions'});
	
	instr.append(getHrDiv());
	instr.append($('<h4 />', {
		'text' : 'Section ' + section.sectionNumber + ' of ' + sections.length,
		'class' : 'text-center'
	}));
	instr.append(getHrDiv());
	instr.append($('<div />', {
		'class' : 'col-xs-12 col-sm-12 col-md-12',
		}).html(section.instructions));
	instr.append(getHrDiv());
	if (section.timeSeconds >0) instr.append( $('<label />',{
		'class':'text-center text-danger', 'style':'display:block;',
		'text':'WARNING: This section is timed - You cannont use "Continue Later" once started.'}
	));
	instr.append(getSurveyNav(2, null, 2));	
	var savelink = $('<div />', { 'class' : 'col-xs-12 form-group has-feedback'});
	savelink.append( $('<label />',{'class':'control-label','text':'"Continue Later" Link:'}));
	savelink.append( $('<input />',{
		'class' : 'form-control',
		'readonly' : true,
		'value' : window.location.origin + '/?&respondant_uuid=' + respondant.respondantUuid,
		'onClick' : 'this.focus();this.select();return false;'
	}));
	savelink.append( $('<span/>',{'class' : 'glyphicon glyphicon-bookmark form-control-feedback', 'style':'padding-right:20px;'}));
	instr.append(savelink);
	instr.attr('page-type',1);
	instr.attr('page-name','section_'+section.sectionNumber+'_of_'+sections.length);
	return instr;
}

//Show Thank You + Completion
function getThankYouPage() {
	var thanks = $('<div />', {'class' : 'item'});
	
	thanks.append(getHrDiv());
	thanks.append($('<div />', {'class' : 'col-xs-12'}).html(survey.thankyouText.replace('[CONFIRMATION_CODE]',textID())));
	thanks.append(getHrDiv());
	thanks.append(getSurveyNav(null, null, 4));	
	thanks.attr('page-type',2);
	thanks.attr('page-name','thank_you');

	return thanks;
}

function getQuestionRow(question, respondant, qcount, pagecount) {
	var questionrow = $('<div />',{
		'id' : 'quesrow_' + question.questionId
	});
	questionrow.append(getDisplayQuestion(question, qcount));
	questionrow.append(getPlainResponseForm(question, respondant, qcount, pagecount));
	if (question.required) questionrow.addClass('required');
	return questionrow;
}

// create the question / response form
function getDisplayQuestion(question, qnum) {
	var qtextdiv = $('<div />', {'class' : 'col-xs-12 col-sm-6 questiontext'})
	
	switch (question.question.questionType) {
		case 15: // Alike Unlike
			qtextdiv.append($('<p />',{
				'text' : 'Are these two Alike or Unlike',
				'qnum' : qnum
			}));
			qtextdiv.append($('<div />', {
				'class' : 'col-xs-6 col-sm-6 col-md-6 questiontext text-center',
				'text' : question.question.answers[0].answerText
					}));
			qtextdiv.append($('<div />', {
				'class' : 'col-xs-6 col-sm-6 col-md-6 questiontext text-center',
				'text' : question.question.answers[1].answerText
					}));
			break;
		case 23: // stroop image
		case 22: // image question
			qtextdiv.append($('<p />',{'qnum' : qnum}).append($('<img />',{'src':question.question.questionMedia})));
			break;
		case 17: // slider
		case 18: // image ranker
		case 21: // cognitive
		case 24: // odd man out
		case 26: // reaction timer
			qtextdiv = $('<div />', {'class' : 'col-xs-12 questiontext'});
		default: // all others
			qtextdiv.append($('<p />',{
				'html' : question.question.questionText,
				'qnum' : qnum
			}));
			break;
	
	}
	return qtextdiv;
}

function getPlainResponseForm(question, respondant, qcount, pagecount) {
	var answerwidth = 'col-xs-12 col-sm-6 col-md-6'; // by default answer is on right side of large screens
	question.question.answers.sort(function(a,b) { return a.displayId < b.displayId ? -1:1;	});
	
	var form =  $('<form />', {
		 'name' : 'question_'+question.questionId,
		 'id' : 'question_'+question.questionId,
		 'data-questionId' : question.questionId,
		 'data-pagecount' : pagecount,
		 'action' : 'javascript:void(0);'
	});
	form.append($('<input/>', {
		name : 'id',
		type : 'hidden',
		id : 'qr'+question.questionId,
		value : ''
	}));
	form.append($('<input/>', {
		name : 'respondantId',
		type : 'hidden',
		value : respondant.id
	}));
	form.append($('<input/>', {
		name : 'questionId',
		type : 'hidden',
		value : question.questionId
	}));
	if (question.required) form.addClass('required');
	switch (question.question.questionType) {
	case 1: // multiple choice (checkbox)
		break;
	case 2: // Thumbs
		var ansdiv = $('<div />', {'class' : 'form-group'});
		var like = $('<div />', {'class' : 'col-xs-6 text-center'});
		var radioLike =	$('<input />', {
			'id'   : 'radiobox-' + question.questionId +"-1",
			'type' : 'radio', 'class' : 'thumbs-up',
			'name': "responseValue",
			'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')',
			'value' :  '10'});
		like.append(radioLike);
		like.append($('<label />', {
			'for'   : 'radiobox-' + question.questionId +"-1", 'class' : 'thumbs-up' }));
		var dislike = $('<div />', {'class' : 'col-xs-6 text-center'});
		var radioDislike =$('<input />', {
			'id'   : 'radiobox-' + question.questionId +"-2",
			'type' : 'radio', 'class' : 'thumbs-down', 
			'name': "responseValue",
			'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')',
			'value' :  '0'});
		dislike.append(radioDislike);
		dislike.append($('<label />', {
			'for'   : 'radiobox-' + question.questionId +"-2", 'class' : 'thumbs-down' }));
		ansdiv.append(like);
		ansdiv.append(dislike);
		ansdiv.append($('<div />', {'class' : 'clearfix'}));
		form.append(ansdiv);
		break;
	case 3: // Schedule
		break; // above not used
	case 4: // Likert (5 Stars)
		var ansdiv = $('<div />', {'class' : 'form-group'});
		ansdiv.addClass('stars');
		for (var i=5;i>0;i--) {
			var ans = 2 * i;
			if (question.direction < 0) ans = 12 - 2* i;
			var star =$('<input/>',{
				'class' : 'star star-' + i,
				'id' : 'star-' + i + '-' + question.questionId,
				'type': 'radio',
				'name': "responseValue",
				'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')',
				'value': ans
			});
			ansdiv.append(star);
			ansdiv.append($('<label />',{
				'class' : 'star star-' + i,
				'for' : 'star-' + i + '-' + question.questionId,
			}));
		}
		ansdiv.append($('<div />', {'class' : 'clearfix'}));
		form.append(ansdiv);
		break;
	case 5: // Likert (5 Boxes)
		var ansdiv  = $('<div />', {
			'class' : 'likertboxes'
		});
		var list = $('<ul />');
		var labels = $('<ul />');
		for (var i=0;i<5;i++) {
			var val = 2 * i + 2;
			if (question.direction < 0) val = 10 - 2* i;
			var scale = $('<li />');
			scale.append($('<input/>',{
				'class' : 'likertbox likertbox-' + i,
				'id' : 'likertbox-' + i + '-' + question.questionId,
				'type': 'radio',
				'name': "responseValue",
				'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')',
				'value': val
			}));
			scale.append($('<label/>',{
				'class' : 'likertbox likertbox-' + i,
				'for' : 'likertbox-' + i + '-' + question.questionId				
			}));
			list.append(scale);
		}
		labels.append($('<li />', { text : 'Strongly Disagree' }));
		labels.append($('<li />', { text : 'Disagree' }));
		labels.append($('<li />', { text : 'Neutral' }));
		labels.append($('<li />', { text : 'Agree' }));
		labels.append($('<li />', { text : 'Strongly Agree' }));

		ansdiv.append(list);
		ansdiv.append(labels);
		form.append(ansdiv);
		break;
	case 7: // yes-idk-no
	case 8: // yes-sometimes-no
	case 9: // five short ans
	case 10: // yes-notsure-no
	case 11: // two short ans
	case 12: // four short ans
	case 13: // other, multi-three-choice
		var ansdiv = $('<div />');
		for (var ans=0;ans<question.question.answers.length;ans++) {
			var answer = question.question.answers[ans];
			var qrespdiv = $('<div />', {
				'style' : 'padding-right: 1px; padding-left: 1px;',
				'class' : 'col-xs-4 col-sm-4 col-md-4'
			});
			var radiobox = $('<input />', {
				'id'   : 'radiobox-' + question.questionId +"-"+ answer.answerValue,
				'type' : 'radio',
				'class' : 'radio-short',
				'name' : 'responseValue',
				'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')',
				'value' :  answer.answerValue
			});
			var radiolabel = $('<label />', {
				'for'   : 'radiobox-' + question.questionId +"-"+ answer.answerValue,
				'class' : 'radio-short',
				'text'  :  answer.answerText.toUpperCase()
			});
		
			qrespdiv.append(radiobox);
			qrespdiv.append(radiolabel);

			ansdiv.append(qrespdiv);
		}
		form.append(ansdiv);
		break;
	case 14: // Rank
		var responseInp = $('<input />', {
			'id'   : 'ranker-' + question.questionId,
			'data-questionId' : question.questionId,
			'type' : 'hidden',
			'class' : 'hidden',
			'name' : 'responseValue',
			'value' :  '12345'
		});
		responseInp.bind('update', function(e) {redrawRanker(this);});
		form.append(responseInp);
		var listdiv = $('<div />');
		var maxoptions = question.question.answers.length;
		var draginstructions = 'Drag options to rank most preferred (1) to least (' + maxoptions + ')';
		listdiv.append($('<div />', {
			'class' : 'instructions',
			'text' : draginstructions
		}));
		var sortablelist = $('<ol />', {
			'id' : 'sortable-' + question.questionId,
			'class' : 'ranker'});
		for (var ans=0;ans<question.question.answers.length;ans++) {
			var answer = question.question.answers[ans];
			var listitem = $('<li />', {
				'data-value' : answer.answerValue
			});
			var span = $('<span />', {'text' : answer.answerText });
			listitem.append($('<i />', {
				'class' : 'fa fa-long-arrow-up pull-right',
				'onClick': 'rankUp('+question.questionId+','+ answer.answerValue+')'
			}));
			listitem.append($('<i />', {
				'class' : 'fa fa-long-arrow-down pull-right',
				'onClick': 'rankDown('+question.questionId+','+ answer.answerValue+')'
			}));
			listitem.append(span);
			sortablelist.append(listitem);
		}
		sortablelist.sortable({stop: 
			function(event, ui){updateRankerIndexes(question.questionId);}});
		
		listdiv.append(sortablelist);
		listdiv.append($('<div />', {
			'class' : 'text-right'
		}).append($('<button />', {
				'type' : 'button',
				'id' : 'saverank-' + question.questionId, 
				'class' : 'ranker-button',
				'text' : "Save",
				'onClick':'submitRank(this.form,'+question.questionId+','+pagecount+');',
				'disabled' : true
			})));
		form.append(listdiv);
		break;
	case 15: // Alike / Unlike
		var ansdiv = $('<div />');
		var alikediv = $('<div />', {'class' : 'col-xs-6 col-sm-6 col-md-6'});
		alikediv.append($('<input />', {
			'id'   : 'radiobox-' + question.questionId +"-1",
			'type' : 'radio', 'class' : 'radio-short', 'name' : 'responseValue',
			'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')', 'value' :  '1'}));
		alikediv.append($('<label />', {
			'for'   : 'radiobox-' + question.questionId +"-1", 'class' : 'radio-short',
			'text'  :  'ALIKE' }));
		var unlikediv = $('<div />', {'class' : 'col-xs-6 col-sm-6 col-md-6'});
		unlikediv.append($('<input />', {
			'id'   : 'radiobox-' + question.questionId +"-2",
			'type' : 'radio', 'class' : 'radio-short', 'name' : 'responseValue',
			'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')', 'value' :  '2'}));
		unlikediv.append($('<label />', {
			'for'   : 'radiobox-' + question.questionId +"-2", 'class' : 'radio-short',
			'text'  :  'UNLIKE' }));
		ansdiv.append(alikediv);
		ansdiv.append(unlikediv);
		form.append(ansdiv);
		break;
	case 16: // Voice
		break;
	case 17: // Slider
		answerwidth = 'col-xs-12'; // switch to full width
		var answerLeft = question.question.answers[0];
		var answerRight = question.question.answers[1];
		var leftdiv =  $('<div />',{'class':'col-xs-6', 'text':answerLeft.answerText});
		var rightdiv =  $('<div />',{'class':'col-xs-6 text-right', 'text':answerRight.answerText});
		var sliderdiv = $('<div />',{'class':'col-xs-12'});
		var slider = $('<input />', {
			'id'   : 'range-' + question.questionId,
			'type' : 'range',
			'class' : 'slider',
			'name' : 'responseValue',
			'max' : answerRight.answerValue,
			'min' : answerLeft.answerValue,
			'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')'});
		
		sliderdiv.append(slider);
		
		form.append(leftdiv);
		form.append(rightdiv);
		form.append(sliderdiv);
		break;
	case 18: // Image Ranker
		answerwidth = 'col-xs-12'; // switch to full width
		var responseInp = $('<input />', {
			'id'   : 'ranker-' + question.questionId,
			'data-questionId' : question.questionId,
			'type' : 'hidden',
			'class' : 'hidden',
			'name' : 'responseValue',
			'value' :  '123456'
		});
		responseInp.bind('update', function(e) {redrawRanker(this);});
		form.append(responseInp);
		var listdiv = $('<div />');
		var maxoptions = question.question.answers.length;
		var draginstructions = 'Drag options to rank most preferred (1) to least (' + maxoptions + ')';		
		listdiv.append($('<div />', {
			'class' : 'instructions',
			'text' : draginstructions
		}));
		var sortablelist = $('<ol />', {
			'id' : 'sortable-' + question.questionId,
			'class' : 'image-ranker'});
		for (var ans=0;ans<question.question.answers.length;ans++) {
			var answer = question.question.answers[ans];
			var listitem = $('<li />', {
				'class' : 'image-ranker-item',
				'data-value' : answer.answerValue
			});
			var controls = $('<div />', {});
			controls.append($('<i />', {
				'class' : 'fa fa-arrow-up',
				'onClick': 'rankUp('+question.questionId+','+ answer.answerValue+')'
			}));
			controls.append($('<span />'));
			controls.append($('<i />', {
				'class' : 'fa fa-arrow-down',
				'onClick': 'rankDown('+question.questionId+','+ answer.answerValue+')'
			}));
			listitem.append(controls);
			listitem.append($('<img />', {'src' : answer.answerMedia}));
			sortablelist.append(listitem);
		}
		sortablelist.sortable({stop: 
			function(event, ui){updateRankerIndexes(question.questionId);}});
		
		listdiv.append(sortablelist);

		listdiv.append($('<div />', {
			'class' : 'text-right'
		}).append($('<button />', {
				'type' : 'button',
				'id' : 'saverank-' + question.questionId, 
				'class' : 'ranker-button',
				'text' : "Save",
				'onClick':'submitRank(this.form,'+question.questionId+','+pagecount+');',
				'disabled' : true
			})));
		form.append(listdiv);
		break;
	case 19: // multichoice image
	case 22: // image series
	case 23: // stroop image choices
		var count = question.question.answers.length;
		for (var ans=0;ans<question.question.answers.length;ans++) {
			var answer = question.question.answers[ans];
			var holder = $('<div />',{'class':'col-xs-4'});
			if ((count == 5) && (ans == 3)) holder.addClass('col-xs-offset-2');
			var radiolabel = $('<label />', {
				'for'   : 'radiobox-' + question.questionId +"-"+ answer.answerValue,
				'class' : 'radio-short'
			});
			radiolabel.append($('<img />', {'src' : answer.answerMedia}));
			var radiobox = $('<input />', {
				'id'   : 'radiobox-' + question.questionId +"-"+ answer.answerValue,
				'type' : 'radio',
				'class' : 'radio-short',
				'name' : 'responseValue',
				'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')',
				'value' :  answer.answerValue
			});
			
			holder.append(radiobox);
			holder.append(radiolabel);
			form.append(holder);
		}
		break;
	case 20: // reference checker
		var namediv = $('<div />', {'class' : 'form-control-group col-xs-6'});
		namediv.append($('<label />',{'class':'control-label','text' : 'Full Name'}));
		namediv.append($('<input />', {
			'class' : 'form-control',
			'type' : 'text',
			'name' : 'refName',
			'id' : 'ref_name_'+question.questionId,
			'onBlur' : 'checkReferenceInput(this.form)'}));
		var emaildiv = $('<div />', {'class' : 'form-control-group col-xs-6', 'id' : 'email_group_'+question.questionId});
		emaildiv.append($('<label />',{'class':'control-label','text' : 'Email'}));
		emaildiv.append($('<input />', {
			'class' : 'form-control',
			'type' : 'email',
			'name' : 'refEmail',
			'id' : 'ref_email_'+question.questionId,
			'onFocus' : '$("#email_group_'+question.questionId+'").removeClass("has-feedback has-error");',
			'onBlur' : 'checkReferenceInput(this.form,'+pagecount+')'}));
		var hidden =  $('<input />', {
			'type' : 'hidden',
			'name' : 'responseText',
			'id' : 'hiddentext_'+question.questionId });
		hidden.bind('update', function(e) {splitReference(this);});
		form.append(hidden);
		form.append(namediv);
		form.append(emaildiv);
		break;
	case 21: // cognitive
		answerwidth = 'col-xs-12'; // switch to full width
		var hidden = $('<input />', {
			'id'   : 'cog_maxval_' + question.questionId,
			'type' : 'hidden',
			'class' : 'hidden',
			'name' : 'responseValue',
			'value' :  '0'
		});
		form.attr('data-direction', question.question.direction);
		form.attr('data-desc', question.question.description);
		
		var test = new WorkingOrderTest(form);
		var testPanel = $('<div />',{'class':'working-order-display text-center'});
		testPanel.append(hidden);
		var display = $('<div />',{'id':'cog_display_' + question.questionId});
		display.append( $('<h2 />',{'text' : 'Click start to begin sequence'}));
		testPanel.append(display);
		var start= $('<button />', {'id':'cog_start_' + question.questionId, 'type':'button','text':'start', 'class': 'btn btn-primary'});
		start.click(function() {test.show();});
		var submit= $('<button />', {'id':'cog_submit_' + question.questionId, 
			'type':'button', 'disabled' : true, 'text':'submit', 'class': 'btn btn-primary'});
		submit.click(function() {test.scoreResponse();});
		var input = $('<input />',{'id':'cog_input_' + question.questionId,
			'pattern' : '\\d*', 'class' : 'form-control', 'disabled' : true});
		testPanel.append(start);
		testPanel.append(input);
		testPanel.append(submit);
		form.append(testPanel);
		form.submit(function(e){test.scoreResponse();});
		break;
	case 24: // odd-man-out
	case 26: // reaction
		answerwidth = 'col-xs-12'; // switch to full width
		form.attr('data-direction', question.question.direction);
		form.attr('data-desc', question.question.description);
		
		var test = new ReactionTimer(form);
		if (question.question.questionType == 24) test = new OddManOut(form);

		var testPanel = $('<div />',{'class':'reaction-display text-center'});
		var hidden = $('<input />', {
			'id'   : 'cog_score_' + question.questionId,
			'type' : 'hidden',
			'class' : 'hidden',
			'name' : 'responseValue',
			'value' :  '0'
		});
		testPanel.append(hidden);
		var instr = $('<span />',{'id':'cog_instr_' + question.questionId, 'text' : 'Click Start to Begin'});
		testPanel.append(instr);
		
		var display = $('<div />',{'id':'reaction_display_' + question.questionId});
		for (var i=0;i<16;i++) {
			var square = $('<div />',{
				'class':'timer-square',
				'id':'rsquare_'+question.questionId+'_'+i,
				'data-number' : i
				}).bind('click',function(event){test.clicked(this);});
			display.append(square);
		}
		testPanel.append(display);

		var start= $('<button />', {'id':'cog_start_' + question.questionId, 'type':'button','text':'Start', 'class': 'btn btn-primary'});
		start.click(function() {test.startTimer();});
		testPanel.append(start);
		form.append(testPanel);
		break;
	case 25: // Configurable Likert (Boxes)
		var ansdiv  = $('<div />', {'class' : 'likertboxes'});
		var list = $('<ul />');
		var labels = $('<ul />');
		for (var i=0;i<question.question.answers.length;i++) {
			var answer = question.question.answers[i];
			var scale = $('<li />');
			scale.append($('<input/>',{
				'class' : 'likertbox likertbox-' + i,
				'id' : 'likertbox-' + i + '-' + question.questionId,
				'type': 'radio',
				'name': "responseValue",
				'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')',
				'value': answer.answerValue
			}));
			scale.append($('<label/>',{
				'class' : 'likertbox likertbox-' + i,
				'for' : 'likertbox-' + i + '-' + question.questionId				
			}));
			list.append(scale);
			labels.append($('<li />', { text : answer.answerText }));
		}

		ansdiv.append(list);
		ansdiv.append(labels);
		form.append(ansdiv);
		break;
	case 27: // notes
		var ansdiv = $('<div />', { 'class' : 'form-control-group'});
		var textarea = $('<textarea />', {
			'class' : 'form-control',
			'name' : 'responseText',
			'id' : 'txtarea_'+question.questionId,
			'onBlur' : 'submitPlainAnswer(this.form,'+pagecount+')'});
		ansdiv.append(textarea);
		form.append(ansdiv);
		break;
	case 28: // Video
		var videoContainer = $('<div />',{
			'class':'video-container text-center',
			'style': 'width: 320px;height: 240px;border: 1px solid #cececc;box-sizing: border-box;margin: 0 auto;',
			'id':'video-container-' + question.questionId});
		var videoControls = $('<div />',{
			'class':'video-controls text-center',
			'id':'video-controls-' + question.questionId});
		var btnStart = $('<button />',{
			'class': 'btn btn-small',
			'text' : 'start',
			'id':'start-recording-' + question.questionId});
		btnStart.attr('data-questionId',question.questionId);		
	    btnStart.bind('click', function() {
	    	this.disabled = true;
	        startRecording($(this).attr('data-questionId'));	        
	    });
		var btnStop = $('<button />',{
			'class':'btn btn-small',
			'text' : 'stop',
			'id':'stop-recording-' + question.questionId});
		btnStop.attr('data-questionId',question.questionId);		
	    btnStop.bind('click', function() {
	    	this.disabled = true;
            mediaRecorder.stop();
            mediaRecorder.stream.stop();
            var questionId = $(this).attr('data-questionId');
            $('#pause-recording-'+questionId).prop('disabled', true);
            $('#start-recording-'+questionId).prop('disabled', false);  
	    });
		var btnPause = $('<button />',{
			'class':'btn btn-small',
			'text' : 'pause',
			'id':'pause-recording-' + question.questionId});
		btnPause.attr('data-questionId',question.questionId);		
	    btnPause.bind('click', function() {
	    	this.disabled = true;
            mediaRecorder.pause();
            var questionId = $(this).attr('data-questionId');
            $('#resume-recording-'+questionId).prop('disabled', false);  
	    });
		var btnResume = $('<button />',{
			'class':'btn btn-small',
			'text' : 'resume',
			'id':'resume-recording-' + question.questionId});
		btnResume.attr('data-questionId',question.questionId);		
	    btnResume.bind('click', function() {
	    	this.disabled = true;
            mediaRecorder.resume();
            var questionId = $(this).attr('data-questionId');
            $('#pause-recording-'+questionId).prop('disabled', false);  
	    });
		var btnSave = $('<button />',{
			'class':'btn btn-small',
			'text' : 'submit',
			'disabled' : 'true',
			'id':'save-recording-' + question.questionId});
		btnSave.attr('data-questionId',question.questionId);		
	    btnSave.bind('click', function() {
	    	this.disabled = true;
	    	mediaRecorder.stop();
	        mediaRecorder.stream.stop();
            uploadResponseMediaToServer($(this).attr('data-questionId'));
            var questionId = $(this).attr('data-questionId');
            $('#resume-recording-'+questionId).prop('disabled', true);
            $('#stop-recording-'+questionId).prop('disabled', true);
            $('#pause-recording-'+questionId).prop('disabled', true);
            $('#start-recording-'+questionId).prop('disabled', true); 
	    });

	    form.append(videoContainer);
	    videoControls.append(btnStart);
	    videoControls.append(btnStop);
	    videoControls.append(btnPause);
	    videoControls.append(btnResume);
	    videoControls.append(btnSave);
	    form.append(videoControls);
		break;
	case 6: // Multiple Choice (radio)
	default:
		// basic multichoice
		for (var ans=0;ans<question.question.answers.length;ans++) {
			var answer = question.question.answers[ans];
			var radiolabel = $('<label />', {
				'for'   : 'radiobox-' + question.questionId +"-"+ answer.answerValue,
				'class' : 'radio-select',
				'text'  :  answer.answerText
			});
			var radiobox = $('<input />', {
				'id'   : 'radiobox-' + question.questionId +"-"+ answer.answerValue,
				'type' : 'radio',
				'class' : 'radio-select',
				'name' : 'responseValue',
				'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')',
				'value' :  answer.answerValue
			});

			form.append(radiobox);
			form.append(radiolabel);
		}
		break;
	}
	
	var ansblock = $('<div />', {'class' : answerwidth });
	ansblock.append(form);
	return ansblock;
}

function getHrDiv () {
	return $('<div />', {
		'class': 'col-xs-12 col-sm-12 col-md-12',
		'html': '<hr>'
	});
}

function getSurveyNav(pagecount, totalpages, pageType) {
	var navigation = $('<div />', {'class': 'container-fluid'});
	var leftnav = $('<div />', {'class': 'col-xs-4 col-sm-4 col-md-4 text-center'});
	var centernav = $('<div />', {'class': 'col-xs-4 col-sm-4 col-md-4 text-center'});
	var rightnav = $('<div />', {'class': 'col-xs-4 col-sm-4 col-md-4 text-center'});	
	var nextbutton = $('<button />', {
		'id' : 'nextbtn-' + pagecount, 
		'class' : 'btn btn-primary',
		'text' : "Next >>",
		'onClick':'nextPage();' });
	
	switch (pageType) {
	case 1: //First Page
		$(nextbutton).text('I Agree');
		centernav.append(nextbutton);
		break;
	case 2: //Instruction Page
		$(nextbutton).text('Start');
		nextbutton.attr('id','startbutton');
		nextbutton.attr('onClick','startAssessment();');
		centernav.append(nextbutton);
		break;
	case 3: //Last page of Section
		leftnav.append($('<button />', {
			'id' : 'prevbtn-' + pagecount, 
			'class' : 'btn btn-primary',
			'text' : "<< Back",
			'onClick':'prevPage();'
		}));
		$(nextbutton).text('Complete');
		nextbutton.attr('disabled', true);
		nextbutton.attr('onClick','submitSection();');
		$(centernav).text('Page '+ pagecount + ' of ' + totalpages);
		rightnav.append(nextbutton);
		break;
	case 4: //Survey Complete (Thank You Page)
		$(nextbutton).text('Submit');
		nextbutton.attr('onClick','submitSurvey();');
		centernav.append(nextbutton);
		break;
	case 5: //Question Page
	default:
		$(centernav).text('Page '+ pagecount + ' of ' + totalpages);
		nextbutton.attr('disabled', true);
		rightnav.append(nextbutton);
		leftnav.append($('<button />', {
			'id' : 'prevbtn-' + pagecount, 
			'class' : 'btn btn-primary',
			'text' : "<< Back",
			'onClick':'prevPage();'
		}));
		break;
	}
	
	navigation.append(leftnav);
	navigation.append(centernav);
	navigation.append(rightnav);
	navigation.hover(function() {document.activeElement.blur();});
	return navigation;
}

function submitSection() {
	var deck = document.getElementById('wrapper');
	if (grader) {
		$.when(submitGrader(grader)).done(function() {graderConfirmation(grader)});
	} else {
		activeSection.complete=true;
		if (endAt != null) {
			endAt = null;
			clearInterval(timeinterval);
		}
		var nextSection = null;
		for (var key in sections) {
			var section = sections[key];
			if ((nextSection == null) && (!section.complete)) nextSection = section;
		}		
	
		if(nextSection != null) {
			activeSection = nextSection;
			$(deck).empty();
			buildSurveySection(deck, activeSection);
			$('#instructions').addClass('active');
		} else {
			getThankYouPage().appendTo(deck);
			nextPage();
		}
	}
}

function isAllReqSectionComplete(sectionnum) {
	var complete = true;
	for (var key in questions ) {
		if ((questions[key].page == sectionnum) &&
		    (responses[questions[key].questionId] == null)) complete = false;
	}
	return complete;
}

function isTimedSectionStarted(sectionnum) {
	var started = false;
	for (var key in questions ) {
		if ((questions[key].page == sectionnum) &&
		    (responses[questions[key].questionId] != null)) started = true;
	}
	return started;
}


function saveResponse(response) {
	responses[response.questionId] = response;
    var field = '#qr' + response.questionId;
    $(field).val(response.id);
    var form = '#question_' + response.questionId;
    $(form).addClass('completed');
    
    if (activeSection.allRequired) {
    	updateProgress();
    }
    
    return;
}

function updateProgress() {
    var totalresponses = 0;
    for (var q in questions) {
    	ques = questions[q]; 
	    if (responses[ques.questionId] !=null) {
	    	if (ques.page == activeSection.sectionNumber) totalresponses++;
	    }
    } 
    progress = 100* totalresponses / activeSection.qtotal;
    $('.progress-bar').attr('style','width:'+progress+'%;');
    $('.progress-bar').attr('aria-valuenow',progress);
	
}

function startAssessment() {
	if (activeSection.timeSeconds > 0) {
		startTimer();
		$('#startbutton').text('Continue');
		$('#startbutton').attr('onClick','nextPage();');
		nextPage();
	} else if (!activeSection.allRequired) {
		nextPage();		
	} else {
		$('#honesty').modal();
	}
}

function startTimer() {
	var t = 1000 * activeSection.timeSeconds;
	$('#timer').removeClass('hidden');

	endAt = Date.parse(new Date()) + t;
	timeinterval = setInterval(function(){
		if (endAt !=null) {
			var t = endAt - Date.parse(new Date());
			updateTimer();
		    if(t<=0){
		    	timesUp();
		    }
		}
	},1000);
}
function timesUp() {
	clearInterval(timeinterval);
	endAt = null;
    $('#timesup').modal();
	submitSection();
}

function updateTimer(){
	var t = 1000 * activeSection.timeSeconds;
	if (endAt !=null) {
	  t = endAt - Date.parse(new Date());
	}
	var secs = Math.floor( (t/1000) % 60 );
	var mins = Math.floor( (t/1000/60) % 60 );
	$('#timer').text(mins + ':' + (secs<10 ? '0':'') + secs);
	if (mins > 0) {
		$('#timer').removeClass('text-danger');
	} else {
		$('#timer').addClass('text-danger');
		if (Math.floor(secs % 10) == 0) {
			$('#timer').fadeOut(100).fadeIn(100);
		}
	}
}

function redrawRanker(inputField) {
	var id = $(inputField).attr('data-questionId');
	var seq = $(inputField).val();
	var items = $('#sortable-'+id).children();
	var chars = seq.split('');
	var lastItem = items[(items.length-1)];
	for (var i=0;i<chars.length;i++) {
		for (var j=0;j<items.length;j++) { 
			if ($(items[j]).attr('data-value') == chars[i]) {
				$(items[j]).insertAfter(lastItem);
				lastItem = items[j];
				break;
			}
		}
	}
	$('#saverank-'+id).addClass('ranker-saved');
}

function rankUp(id, num){
	var items = $('#sortable-'+id).children();
	var currentIndex = -1; // not found yet
	for (var index in items) { 
		if ((currentIndex == -1) && ($(items[index]).attr('data-value') == num)) currentIndex = index;
	}
	if (currentIndex > 0) {
		$(items[currentIndex]).fadeOut(100);
		$(items[currentIndex]).insertBefore(items[(currentIndex-1)]);
		$(items[currentIndex]).fadeIn(100);
	}
	updateRankerIndexes(id);
}

function rankDown(id, num){
	var items = $('#sortable-'+id).children();
	var currentIndex = -1; // not found yet
	for (var index in items) { 
		if ((currentIndex == -1) && ($(items[index]).attr('data-value') == num)) currentIndex = index;
	}
	currentIndex++;
	if ((currentIndex > 0) && (currentIndex < (items.length))) {
		$(items[currentIndex-1]).fadeOut(100);
		$(items[currentIndex]).insertBefore(items[currentIndex-1]);
		$(items[currentIndex-1]).fadeIn(100);
	}
	updateRankerIndexes(id);
}

function updateRankerIndexes(id){
	var items = $('#sortable-'+id).children();
	var rankerval = "";
    $(items).each(function(i){
    	rankerval += $(this).attr('data-value');
    });
    $('#ranker-' + id).val(rankerval);
	$('#saverank-'+id).removeClass('ranker-saved');
	$('#saverank-'+id).addClass('ranker-edited');
	$('#saverank-'+id).text('Save');
    $('#saverank-'+id).attr('disabled', false);
}

function submitRank(form, id, pagenum) {
	$('#saverank-'+id).addClass('ranker-saved');
	$('#saverank-'+id).removeClass('ranker-edited');
	$('#saverank-'+id).attr('disabled', true);
	$('#saverank-'+id).text('Saved');
    submitPlainAnswer(form, pagenum);
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}


function textID() {
	var padded = "000000" + respondant.id;
	var text = padded.substr(padded.length-7);
	return text.substr(0, 3) + '-' + text.substr(3, 4);
}

/*********
 * 
 *   Cognitive Stuff - to be pulled into different place
 *   Need to pass in only the form itself..
 *   
 */

function WorkingOrderTest(form) {
	this.questionId = $(form).attr('data-questionId');
	this.pagenum = $(form).attr('data-pagecount');
	this.direction = $(form).attr('data-direction');
    this.init();
}

WorkingOrderTest.prototype.init = function(form) {
  this.maxValue = 0;
  this.currentCount = 3;   //default size = 3
  this.score = 2; // total number of mistakes allowed
  this.currentSet = this.generateSet();
  this.pass = true;
  this.shown = false;
  this.rightanswer = true; // used in delayed working mem test.
  this.index = 0;
  this.questions = [ 'Does 4 + 7 = 12?',
                     'Fleas weigh more than airplanes',
                     'Does (4 / 4)+8=10',
                     'Winter coats keep you warm',
                     'Does (8-2)+5=11',
                     'It is important to walk your car',
                     'Does (2-3)*4=-4',
                     'Turtles are faster than race cars',
                     'Does (8/2) + (9/3)=11',
                     'Does (3/3)=1',
                     'Many birds can fly',
                     'Does ((4-2-1))/4=1/4',
                     'Does 4 + 7 = 12?',
                     'Four quarters equals a dollar',
                     '5X3 is greater than 11',
                     'A nickel is worth more than a dime',
                     'Does 8+5 = 13?',
                     'Do most cats have 4 legs?',
                     'Is 20 greater than 14 + 7?',
                     'Dogs can often fly',
                     'Does 5 + 4 = 9',
                     'Clouds are heavier than air',
                     'Cheetahs are faster than people?',
                     'Does (8*6)-3=46',
                     'Does (9*4)+(2-0)=40',
                     'Does (3*9)-8=19' ];
  this.answers = [ false,false,false,true,true,false,true,false,false,true,true,true,false,true,true,false,true,true,false,false,true,false,true,false,false,true,];

}

WorkingOrderTest.prototype.generateSet = function() {
    var arrNumber = [];
    for (var i=0;i<this.currentCount;i++) {
    	arrNumber.push(Math.floor(Math.random() * 10));
    }
    return arrNumber;
}

WorkingOrderTest.prototype.nextDistractionQuestion = function() {
	this.question = this.questions[this.index];
	this.answer = this.answers[this.index];
	this.rightanswer = true;
	this.index++;
}


WorkingOrderTest.prototype.show = function() {
	if (this.isDone()) return;
	$('#cog_start_'+this.questionId).prop('disabled',true);
	$('#cog_input_'+this.questionId).val('');;
	$('#cog_display_'+this.questionId).empty();
	
	var target = '#cog_display_'+this.questionId;
    var set = this.currentSet;
    for (var i = 0; i <this.currentSet.length; i++) {
    	delayDisplay(i);
	}
    
    var test = this;
    setTimeout(function() {
        test.sequenceComplete();
    }, 200 + 2000*set.length); 
    
    function delayDisplay(i) {
        setTimeout(function(){
        	$(target).html(set[i]);
        	},1000 + 2000*i);
        setTimeout(function(){
        	$(target).html('');
        	},2000 + 2000*i);
    }
}

WorkingOrderTest.prototype.sequenceComplete = function() {
	
    if (this.direction == 0) $('#cog_display_'+this.questionId).append($('<h2/>',{text:'Enter digits in the order you saw them'}));
	if (this.direction == 1) $('#cog_display_'+this.questionId).append($('<h2/>',{text:'Enter digits in increasing order'}));
	if (this.direction == -1) $('#cog_display_'+this.questionId).append($('<h2/>',{text:'Enter digits in descending order'}));
	if (this.direction == 99) {
		var test = this;
		this.nextDistractionQuestion();
		var truebutton = $('<h3/>',{text:'yes'}).bind('click', function() {test.trueFalseClicked(true)});
		var falsebutton = $('<h3/>',{text:'no'}).bind('click', function() {test.trueFalseClicked(false)});
		$('#cog_display_'+this.questionId).append($('<h2/>',{text:this.question}));
		$('#cog_display_'+this.questionId).append(truebutton);
		$('#cog_display_'+this.questionId).append(falsebutton);
	} else {
		$('#cog_input_'+this.questionId).prop('disabled',false);
		$('#cog_input_'+this.questionId).focus(); 
		$('#cog_submit_'+this.questionId).prop('disabled',false);
	}
    this.shown = true;
}

WorkingOrderTest.prototype.trueFalseClicked = function(variable) {
	this.rightanswer = (variable == this.answer);
	$('#cog_display_'+this.questionId).empty();
	$('#cog_display_'+this.questionId).append($('<h2/>',{text:'Enter digits in the order you saw them'}));
	$('#cog_input_'+this.questionId).prop('disabled',false);
	$('#cog_input_'+this.questionId).focus(); 
	$('#cog_submit_'+this.questionId).prop('disabled',false);	
}

WorkingOrderTest.prototype.scoreResponse = function() {
	$('#cog_display_'+this.questionId).empty();
	$('#cog_input_'+this.questionId).prop('disabled',true);
	$('#cog_submit_'+this.questionId).prop('disabled',true);
	var responses = $('#cog_input_'+this.questionId).val().split('');
	var answers = this.currentSet;
	this.pass = true;
	if (this.direction == 1) answers = this.currentSet.sort();
	if (this.direction == -1) answers = this.currentSet.sort(function(a, b){return b-a});
	for (var i=0;i<answers.length;i++) {
		if(answers[i] != responses[i]) {
			this.pass = false;
			break;
		};
	}
	this.next();
}

WorkingOrderTest.prototype.next = function() {
	if (this.pass && this.rightanswer) {
		this.maxValue = this.currentCount;
		this.currentCount++;
	} else {
		this.score--;
	}
	if (this.score >0) {
		this.currentSet = this.generateSet();
        this.shown = false;
        this.pass = true;
		//intructions + enable start.
        $('#cog_display_'+this.questionId).append($('<h2/>',{text:'Answer Accepted. Click Continue When Ready.'}));
		//$('#cog_instr_'+this.questionId).text('Answer Accepted. Click Continue When Ready.');
		$('#cog_start_'+this.questionId).prop('disabled',false);
		$('#cog_start_'+this.questionId).text('continue');
	} else {
		// send to to server and disable.
		$('#cog_maxval_'+this.questionId).val(this.maxValue);
		var fields = $('#question_'+this.questionId).serializeArray();
		var response = {};
		for (var i=0;i<fields.length;i++) {
			response[fields[i].name] = fields[i].value;
		}
		var pagenum = this.pagenum;
		sendResponse(response, function(data) {
			saveResponse(data);
			isPageComplete(pagenum);
		});
		$('#cog_display_'+this.questionId).append($('<h2/>',{text:'Answer Accepted. You Have Completed This Test'}));
	}
}

WorkingOrderTest.prototype.isDone = function() {
	if ($('#qr'+this.questionId).val()) {
		$('#cog_start_'+this.questionId).prop('disabled', true);
		$('#cog_submit_'+this.questionId).prop('disabled',true);
		$('#cog_display_'+this.questionId).empty();
		$('#cog_display_'+this.questionId).append($('<h2/>',{text:'Answer Accepted. You Have Completed This Test'}));
		return true;
	}
	return false;
}


/*********
 * 
 *   Simple Reaction time tester
 *   Need to pass in only the form itself..
 */

function ReactionTimer(form) {
	this.form = form;
	this.running=false;
	this.questionId = $(form).attr('data-questionId');
	this.pagenum = $(form).attr('data-pagecount');
}

ReactionTimer.prototype.startTimer = function() {
	if(this.isDone() || (this.running)) return;
	this.running=true;
	var theTimer = this;
	this.correct = 0;
	this.incorrect = 0;
	//disable start button.
	$('#reaction_display_'+this.questionId).addClass('running');
	$('#cog_instr_'+this.questionId).text('Click each red square as it lights up.');	
	$('#cog_start_'+this.questionId).prop('disabled', true);
    setTimeout(function(){
    	theTimer.completed();
    	},20500);
    setTimeout(function(){
    	theTimer.nextSquare();
    	},500);
}

ReactionTimer.prototype.nextSquare = function() {
	$('.on', '#reaction_display_'+this.questionId).each(function () {$(this).removeClass('on');});
	var i = Math.floor(Math.random() * 16)
	var square = '#rsquare_' + this.questionId + '_' +i;
	$(square).addClass('on');
}

ReactionTimer.prototype.clicked = function(square) {
	if(!this.running) return;
	if ($(square).hasClass('on')) {
		this.correct++;
	} else {
		this.incorrect++;
	}
	this.nextSquare();
}

ReactionTimer.prototype.completed = function() {
	this.running = false;
	$('#reaction_display_'+this.questionId).removeClass('running');
	$('.on', '#reaction_display_'+this.questionId).each(function () {$(this).removeClass('on');});

	$('#cog_score_'+this.questionId).val(this.correct);
	var fields = $('#question_'+this.questionId).serializeArray();
	var response = {};
	for (var i=0;i<fields.length;i++) {
		response[fields[i].name] = fields[i].value;
	}	
	var pagenum = this.pagenum;
	sendResponse(response, function(data) {
		saveResponse(data);
		isPageComplete(pagenum);
	});
	$('#cog_instr_'+this.questionId).text('Answer Accepted. You Have Completed This Test');	
}

ReactionTimer.prototype.isDone = function() {
	if ($('#qr'+this.questionId).val()) {
		$('#cog_start_'+this.questionId).prop('disabled', true);
		$('#cog_instr_'+this.questionId).text('You Have Already Completed This Test');	
		return true;
	}
	return false;
}

/*********
 * 
 *   Odd Man Out Test
 *   Direction: 1=one color odd man, 2=select black, 3=two color odd man
 *   Need to pass in only the form itself..
 */

function OddManOut(form) {
	this.form = form;
	this.running=false;
	this.questionId = $(form).attr('data-questionId');
	this.direction = $(form).attr('data-direction');
	this.pagenum = $(form).attr('data-pagecount');
	this.slides = this.getSlides();
}

OddManOut.prototype.getSlides = function() {
	var slides = [];
	slides[0] = [0,0,0,0,0,1,0,0,0,0,0,-1,0,0,-1,0];
	slides[1] = [1,0,0,0,0,0,-1,0,0,0,0,-1,0,0,-1,0];
	slides[2] = [-1,-1,0,0,0,-1,0,0,-1,0,0,0,0,0,1,0];
	slides[3] = [0,1,0,0,0,0,0,0,-1,0,0,0,0,-1,0,0];
	slides[4] = [0,1,0,0,0,0,0,0,0,-1,0,-1,0,0,-1,0];
	slides[5] = [0,-1,0,0,0,0,-1,0,1,0,0,-1,0,0,0,0];
	slides[6] = [0,-1,0,0,0,-1,0,0,-1,0,0,1,0,0,0,0];
	slides[7] = [0,0,0,-1,1,0,-1,0,0,0,0,-1,0,0,-1,0];
	slides[8] = [0,0,0,0,1,0,0,0,0,0,0,-1,0,0,-1,0];
	slides[9] = [1,0,0,0,0,0,0,0,0,-1,0,-1,0,0,-1,0];
	slides[10] = [-1,0,-1,0,-1,-1,0,0,0,0,0,1,0,0,0,0];
	slides[11] = [0,0,-1,0,1,0,0,-1,0,0,0,0,0,0,0,0];
	slides[12] = [0,0,0,0,1,0,-1,0,0,0,0,-1,0,0,-1,0];
	slides[13] = [0,0,1,0,-1,0,0,0,0,-1,0,0,0,0,-1,0];
	slides[14] = [0,0,-1,0,-1,-1,0,0,0,0,0,0,0,0,1,0];
	slides[15] = [0,1,0,0,0,0,0,0,0,-1,0,-1,-1,0,-1,0];
	return slides;
}

OddManOut.prototype.startTimer = function() {
	if(this.isDone() || (this.running)) return;
	this.running=true;
	var theTimer = this;
	this.correct = 0;
	this.incorrect = 0;
	//disable start button.
	$('#reaction_display_'+this.questionId).addClass('running');

	$('#cog_instr_'+this.questionId).text('Click the square that is not touching the others.');
	if (this.direction == 2) $('#cog_instr_'+this.questionId).text('Click the black square.');
	$('#cog_start_'+this.questionId).prop('disabled', true);
    setTimeout(function(){
    	theTimer.completed();
    	},20500);
    setTimeout(function(){
    	theTimer.nextSlide();
    	},500);
}

OddManOut.prototype.nextSlide = function() {
	$('.on', '#reaction_display_'+this.questionId).each(function () {$(this).removeClass('on');});
	$('.correct', '#reaction_display_'+this.questionId).each(function () {$(this).removeClass('correct');});
	var i = Math.floor(Math.random() * 16)
	var slide = this.slides[i];
	var active = [];
	for (var j=0;j<slide.length;j++) {
		var square = '#rsquare_' + this.questionId + '_' +j;
		if (slide[j] != 0) {
			$(square).addClass('on');
			active.push(j);
		}
		if ((this.direction == 3) && (Math.random()>.5)) $(square).toggleClass('black');
		if ((this.direction != 2) && (slide[j] == 1)) $(square).addClass('correct');
	}
	if (this.direction == 2) {
		$('.black', '#reaction_display_'+this.questionId).each(function () {$(this).removeClass('black');});
		var j = Math.floor(Math.random() * active.length);
		$('#rsquare_' + this.questionId + '_' +active[j]).addClass('correct black');
	}
}

OddManOut.prototype.clicked = function(square) {
	if(!this.running) return;
	if ($(square).hasClass('correct')) {
		this.correct++;
	} else {
		this.incorrect++;
	}
	this.nextSlide();
}

OddManOut.prototype.completed = function() {
	this.running = false;
	$('#reaction_display_'+this.questionId).removeClass('running');
	$('.on', '#reaction_display_'+this.questionId).each(function () {$(this).removeClass('on');});

	$('#cog_score_'+this.questionId).val(this.correct);
	var fields = $('#question_'+this.questionId).serializeArray();
	var response = {};
	for (var i=0;i<fields.length;i++) {
		response[fields[i].name] = fields[i].value;
	}	
	var pagenum = this.pagenum;
	sendResponse(response, function(data) {
		saveResponse(data);
		isPageComplete(pagenum);
	});
	$('#cog_instr_'+this.questionId).text('Answer Accepted. You Have Completed This Test');	
}

OddManOut.prototype.isDone = function() {
	if ($('#qr'+this.questionId).val()) {
		$('#cog_start_'+this.questionId).prop('disabled', true);
		$('#cog_instr_'+this.questionId).text('You Have Already Completed This Test');	
		return true;
	}
	return false;
}



/**
 * 
 * Video Recording - using MediaStreamRecorder JS
 * 
 */

function startRecording(questionId) {
	activeMediaQuestion = questionId;
    navigator.mediaDevices.getUserMedia({audio: !IsOpera && !IsEdge, video: true }).then(onMediaSuccess).catch(onMediaError);
}

function onMediaSuccess(stream) {
    var video = $('<video />', {
        controls: true,
        muted: true,
        width: 320,
        height: 240,
        id : 'video-' + activeMediaQuestion,
        src: URL.createObjectURL(stream)	
    });
    var timeInterval = 120000;
    $('#video-container-'+activeMediaQuestion).empty();
    $('#video-container-'+activeMediaQuestion).append(video);
    video.get(0).play();
    console.log(video);
    mediaRecorder = new MediaStreamRecorder(stream);
    mediaRecorder.stream = stream;
    mediaRecorder.videoWidth = 320;
    mediaRecorder.videoHeight = 240;
    mediaRecorder.ondataavailable = function(blob) {
    	console.log('stop clicked');
    	$('#video-'+ activeMediaQuestion).attr('src', URL.createObjectURL(blob));
    	$('#video-'+ activeMediaQuestion).data('recording', blob);
        console.log('attached media to video-object');
    };
    // get blob after specific time interval
    mediaRecorder.start(timeInterval);
    $('#stop-recording-'+activeMediaQuestion).prop('disabled', false);
    $('#pause-recording-'+activeMediaQuestion).prop('disabled', false);
    $('#save-recording-'+activeMediaQuestion).prop('disabled', false);
}

function uploadResponseMediaToServer(questionId) {
    var formData = new FormData();
	var blob = $('#video-'+ questionId).data('recording');
    var file = new File([blob], 'msr-' + (new Date).toISOString().replace(/:|\./g, '-') + '.webm', {
        type: 'video/webm'
    }); 
	var fields = $('#question_'+ questionId).serializeArray();
	for (var i=0;i<fields.length;i++) {
		formData.append(fields[i].name, fields[i].value);
	}
    formData.append('media', file, file.name);
     
    var pagenum =  $('#question_'+ questionId).data('pagecount');
    sendMediaResponse(formData, function(data) {
    	saveResponse(data.entity);
		isPageComplete(pagenum);
	});
}

function bytesToSize(bytes) {
    var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

function getTimeLength(milliseconds) {
    var data = new Date(milliseconds);
    return data.getUTCHours() + " hours, " + data.getUTCMinutes() + " minutes and " + data.getUTCSeconds() + " second(s)";
}

function onMediaError(e) {
    console.error('media error', e);
}