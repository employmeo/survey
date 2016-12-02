//
// Global Variables and actions for the survey page(s)
//
var urlParams;
var respondant;
var survey;
var activeSection;
var questions;
var totalpages;
var responses;
var pagination;
var progress;
var sections;
var endAt;
var timeinterval;
var servicePath = '/survey/1/';

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
}

function launchApp() {
	$('#wait').removeClass('hidden');
	$('#survey').carousel('pause');
	enableSwiping();
	if (urlParams.respondant_uuid != null) {
		getRespondant(urlParams.respondant_uuid);
	    getRespondantSurvey(urlParams.respondant_uuid);
	} else if (urlParams.benchmark != null) {
		getAccountSurvey(urlParams.benchmark, function(data) {
        	survey = data;
        	buildLookupRespondantForm();
        });	
	} else if (urlParams.asid != null) {
		getAccountSurvey(urlParams.asid, function(data) {
        	survey = data;
            buildNewRespondantForm();
        });
	} else {
		showError({"responseText" : "No ID Provided"});
	}
}

function lookupRespondant(form) {
    var lookup = {};
	var fields = $(form).serializeArray();
	for (var i=0;i<fields.length;i++) {
		lookup[fields[i].name] = fields[i].value;
	}
	getRespondantByPayrollId(lookup.id,lookup.asid);
}

function submitNewRespondant(form) {
	$('#wait').removeClass('hidden');
    var order = {};
	var fields = $(form).serializeArray();
	for (var i=0;i<fields.length;i++) {
		order[fields[i].name] = fields[i].value;
	}
	orderNewAssessment(order);
}

function submitPlainAnswer(form, pagenum) {
	var fields = $(form).serializeArray();
	var response = {};
	for (var i=0;i<fields.length;i++) {
		response[fields[i].name] = fields[i].value;
	}
	sendResponse(response, function(data) {
		saveResponse(data);
		isPageComplete(pagenum);
	});
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
	var qlist = pagination[pagenum];
	var complete = true;
	for (var key in qlist ) {
		if (responses[qlist[key].questionId] == null) complete = false;
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

// Code for building survey pages.
function buildNewRespondantForm() {
  // code to create a form to fill out for a new survey respondant	
	var deck = document.getElementById('wrapper');
	$(deck).empty();
	var infopage = $('<div />', {});
	
	infopage.append(getHrDiv());
	infopage.append($('<div />', {
		'class' : 'col-xs-12 col-sm-12 col-md-12',
		}).html("<h3>Applicant Info</h3>"));
	infopage.append(getHrDiv());

	var form = $('<form />',{
		'class' : 'form',
		'action' : 'javascript:void(0);',
		'onSubmit' : 'submitNewRespondant(this);'
	});
	form.append($('<input />', {
		'type' : 'hidden',
		'name' : 'asid',
		'value' : survey.id
	}));

	/* First Name */
	form.append($('<label />', {
		'for' : 'fname',
		'text' : 'First Name:'
	}));
	
	var row = $('<div />', {
		'class' : 'input-group has-feedback'
	});
	row.append($('<span />', {
		'class' : 'input-group-addon'}).html("<i class='fa fa-user fa-fw'></i>"));
	row.append($('<input />', {
		'class' : 'form-control',
		'type' : 'text',
		'name' : 'fname',
		'placeholder' : 'First Name',
		'required' : true				
	}));
	form.append(row);

	/* Last Name */
	form.append($('<label />', {
		'for' : 'lname',
		'text' : 'Last Name:'
	}));
    row = $('<div />', {
			'class' : 'input-group has-feedback'
		});
	row.append($('<span />', {
		'class' : 'input-group-addon'}).html("<i class='fa fa-user fa-fw'></i>"));
	row.append($('<input />', {
		'class' : 'form-control',
		'type' : 'text',
		'name' : 'lname',
		'placeholder' : 'Last Name',
		'required' : true				
	}));
	form.append(row);

	/* Email */	
	form.append($('<label />', {
		'for' : 'email',
		'text' : 'E-mail Address:'
	}));
	row = $('<div />', {
		'class' : 'input-group has-feedback'
	});
	row.append($('<span />', {
	'class' : 'input-group-addon'}).html("<i class='fa fa-envelope fa-fw'></i>"));
	row.append($('<input />', {
		'class' : 'form-control',
		'type' : 'email',
		'name' : 'email',
		'placeholder' : 'email',
		'required' : true		
	}));
	form.append(row);

	/* Home Address */
	form.append($('<label />', {
		'for' : 'address',
		'text' : 'Home Address:'
	}));
	row = $('<div />', {
		'class' : 'input-group has-feedback'
	});
	row.append($('<span />', {
	'class' : 'input-group-addon'}).html("<i class='fa fa-home fa-fw'></i>"));
	row.append($('<input />', {
		'class' : 'form-control',
		'type' : 'text',
		'name' : 'address',
		'id' : 'address',
		'required' : true				
	}));
	form.append(row);
	
	/* Button */
	form.append(getHrDiv());
	form.append($('<input />', {
		'type' : 'hidden',
		'name' : 'lat',
		'id' : 'lat'
	}));
	form.append($('<input />', {
		'type' : 'hidden',
		'name' : 'lng',
		'id' : 'lng'				
	}));
	form.append($('<input />', {
		'type' : 'hidden',
		'name' : 'formatted_address',
		'id' : 'formatted_address'				
	}));
	form.append($('<input />', {
		'type' : 'hidden',
		'name' : 'country_short',
		'id' : 'country_short'				
	}));
	form.append($('<button />', {
		'type' : 'submit',
		'class' : 'btn btn-primary',
		'text' : 'Submit'
	}));

	infopage.append($('<div />', {
		'class' : 'col-xs-12 col-sm-12 col-md-12',
		}).append(form));
	infopage.appendTo(deck);
	
	$('#address').geocomplete({details:'form'});

	$('#wait').addClass('hidden');
}


// 
function buildLookupRespondantForm() {
	  // code to create a form to fill out for a new survey respondant	
		var deck = document.getElementById('wrapper');
		$(deck).empty();
		var infopage = $('<div />', {});
		infopage.append(getHrDiv());
		infopage.append($('<div />', {
			'class' : 'col-xs-12 col-sm-12 col-md-12 text-center',
			}).html("<h3>Enter Employee ID</h3>"));
		infopage.append(getHrDiv());

		var form = $('<form />',{
			'class' : 'form',
			'action' : 'javascript:void(0);',
			'onSubmit' : 'lookupRespondant(this);'
		});
		form.append($('<input />', {
			'type' : 'hidden',
			'name' : 'asid',
			'value' : urlParams.benchmark 
		}));
		form.append($('<label />', {
			'for' : 'fname',
			'text' : 'Employee ID:'
		}));
		
		var row = $('<div />', {
			'class' : 'input-group has-feedback'
		});
		row.append($('<span />', {
			'class' : 'input-group-addon'}).html("<i class='fa fa-user fa-fw'></i>"));
		row.append($('<input />', {
			'class' : 'form-control',
			'type' : 'text',
			'name' : 'id',
			'placeholder' : 'ID#',
			'required' : true			
		}));
		form.append(row);
		form.append(getHrDiv());
		form.append($('<div />', {
			'class' : 'col-xs-12 col-sm-12 col-md-12 text-center',
			}).append($('<button />', {
			'type' : 'submit',
			'class' : 'btn btn-primary',
			'text' : 'Submit'
		})));

		infopage.append($('<div />', {
			'class' : 'col-xs-12 col-sm-12 col-md-12',
			}).append(form));
		infopage.append(getHrDiv());
		infopage.appendTo(deck);
		
		// Remove the wait screen
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
		if (section.allRequired) {
			section.complete = isAllReqSectionComplete(section.sectionNumber);
		} else if (section.section_timed) {
			section.complete = isTimedSectionStarted(section.sectionNumber);
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



function buildSurveySection(deck, section) {
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
	pagination[pagecount] = new Array();
	
	for (var q=0;q<questions.length;q++) {
		var question = questions[q];
		if (question.page == section.sectionNumber) {
				qcount++;
				if (qpp == qlimit) {
					card.append(getSurveyNav(pagecount, totalpages, 5));	
					card.attr('page-type',3);
					card.appendTo(deck);
					pagecount++;
					pagination[pagecount] = new Array();
					qpp = 0;
					card = $('<div />', {'class' : 'questionpage item'});
					card.append(getHrDiv());				
				}
				var pageqs = pagination[pagecount];
				pageqs[qpp] = question;
				qpp++;
				var questionrow = $('<div />');
				questionrow.append(getDisplayQuestion(question, qcount));
				questionrow.append(getPlainResponseForm(question, respondant, qcount, pagecount));	
				card.append(questionrow);
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
			    var radios =$('form[name=question_'+responses[i].questionId+
    		    '] :input[name=responseValue][value=' + responses[i].responseValue + ']');
		        $(radios).prop('checked', true);
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
	preamble.append($('<div />', {
		'class' : 'col-xs-12 col-sm-12 col-md-12',
		}).html(survey.preambleText));
	preamble.append(getHrDiv());
	preamble.append(getSurveyNav(1, null, 1));	
	preamble.attr('page-type',0);
	return preamble;
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
	instr.append(getSurveyNav(2, null, 2));	
	instr.attr('page-type',1);
	return instr;
}

//Show Thank You + Completion
function getThankYouPage() {
	var thanks = $('<div />', {'class' : 'item'});
	
	thanks.append(getHrDiv());
	thanks.append($('<div />', {
		'class' : 'col-xs-12 col-sm-12 col-md-12',
		}).html(survey.thankyouText));
	thanks.append(getHrDiv());
	thanks.append(getSurveyNav(null, null, 4));	

	thanks.attr('page-type',2);

	return thanks;
}



// create the question / response form
function getDisplayQuestion(question, qnum) {
	var qtextdiv = $('<div />', {'class' : 'col-xs-12 col-sm-6 col-md-6 questiontext'})

	if (question.question.questionType == 15) { //change display for alike / unlike
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
	} else {
		qtextdiv.append($('<p />',{
			'html' : question.question.questionText,
			'qnum' : qnum
		}));
	}
	
	return qtextdiv;
}

function getPlainResponseForm(question, respondant, qcount, pagecount) {
	var answerwidth = 'col-xs-12 col-sm-6 col-md-6'; // by default answer is on right side of large screens
	question.question.answers.sort(function(a,b) {
		return a.displayId < b.displayId ? -1:1;
	});
	
	var form =  $('<form />', {
		 'name' : 'question_'+question.questionId,
		 'id' : 'question_'+question.questionId,
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

	switch (question.question.questionType) {
	case 9: // five short ans
	case 11: // two short ans
	case 12: // four short ans
	case 7: // yes-idk-no
	case 8: // yes-sometimes-no
	case 10: // yes-notsure-no
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
	case 1: // multiple choice (checkbox)
	case 2: // Me - Not Me
	case 3: // Schedule (not used)
	case 4: // Likert (Stars)
		break;
	case 5: // Likert (Boxes)
		var ansdiv  = $('<div />', {
			'class' : 'likertboxes'
		});
		var list = $('<ul />');
		var labels = $('<ul />');
		for (var ans=0;ans<question.question.answers.length;ans++) {
			var answer = question.question.answers[ans];
			var i = ans +1;
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
	case 14: // Rank
		var responseInp = $('<input />', {
			'id'   : 'ranker-' + question.questionId,
			'type' : 'hidden',
			'class' : 'hidden',
			'name' : 'responseValue',
			'value' :  '12345'
		});
		form.append(responseInp);
		var listdiv = $('<div />');
		listdiv.append($('<div />', {
			'class' : 'instructions',
			'text' : 'Drag options to rank most preferred (1) to least (5)'
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
		var answerLeft = question.question.answers[0];
		var answerRight = question.question.answers[1];
		var leftdiv =  $('<div />',{'class':'col-xs-3', 'text':answerLeft.answerText});
		var rightdiv =  $('<div />',{'class':'col-xs-3', 'text':answerRight.answerText});
		var sliderdiv = $('<div />',{'class':'col-xs-6'});
		var slider = $('<input />', {
			'id'   : 'range-' + question.questionId,
			'type' : 'range',
			'class' : 'slider',
			'name' : 'responseValue',
			'max' : answerRight.answerValue,
			'min' : answerLeft.answerValue,
			'onChange' : 'submitPlainAnswer(this.form,'+pagecount+')'});
		
		$(slider).on('input', disableSwiping);
		$(slider).on('stop', enableSwiping);
		sliderdiv.append(slider);
		
		form.append(leftdiv);
		form.append(sliderdiv);
		form.append(rightdiv);
		break;
	case 18: // Image Ranker
		answerwidth = 'col-xs-12'; // switch to full width
		var responseInp = $('<input />', {
			'id'   : 'ranker-' + question.questionId,
			'type' : 'hidden',
			'class' : 'hidden',
			'name' : 'responseValue',
			'value' :  '123456'
		});
		form.append(responseInp);
		var listdiv = $('<div />');
		listdiv.append($('<div />', {
			'class' : 'instructions',
			'text' : 'Drag options to rank most preferred (1) to least (6)'
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
		break;
	case 21: // cognitive
		//answerwidth = 'col-xs-12'; // switch to full width
		var hidden = $('<input />', {
			'id'   : 'cog_maxval_' + question.questionId,
			'type' : 'hidden',
			'class' : 'hidden',
			'name' : 'responseValue',
			'value' :  '0'
		});

		var test = new WorkingOrderTest(question.questionId, pagecount);
		var testPanel = $('<div />',{'class':'working-order-display text-center'});
		testPanel.append(hidden);
		var display = $('<div />',{'id':'cog_display_' + question.questionId});
		testPanel.append(display);
		var start= $('<button />', {'id':'cog_start_' + question.questionId, 'type':'button','text':'start', 'class': 'btn'});
		start.click(function() {test.show();});
		var submit= $('<button />', {'id':'cog_submit_' + question.questionId, 
			'type':'button', 'disabled' : true, 'text':'submit', 'class': 'btn'});
		submit.click(function() {test.scoreResponse();});
		var input = $('<input />',{'id':'cog_input_' + question.questionId, 'disabled' : true});
		var instr = $('<span />',{'id':'cog_instr_' + question.questionId, 'text' : 'to get started click start'});
		testPanel.append(start);
		testPanel.append(instr);
		testPanel.append(input);
		testPanel.append(submit);
		form.append(testPanel);
		form.submit(function(e){test.scoreResponse();});
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
	
	return navigation;
}

function submitSection() {
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
	var deck = document.getElementById('wrapper');
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




/*********
 * 
 *   Cognitive Stuff - to be pulled into different place
 * 
 */


function WorkingOrderTest(questionId, pagecount) {
	this.questionId = questionId;
	this.pagecount = pagecount;
    this.init();
}

WorkingOrderTest.prototype.init = function() {
  this.maxValue = 0;
  this.currentCount = 3;   //default size = 3
  this.score = 2; // total number of mistakes allowed
  this.currentSet = this.generateSet();
  this.shown = false;
}

WorkingOrderTest.prototype.generateSet = function() {
    var arrNumber = [];
    for (var i=0;i<this.currentCount;i++) {
    	arrNumber.push(Math.floor(Math.random() * 10));
    }
    return arrNumber;
}

WorkingOrderTest.prototype.show = function() {
	$('#cog_start_'+this.questionId).prop('disabled',true);
	$('#cog_input_'+this.questionId).val('');;
	$('#cog_instr_'+this.questionId).text('');
	
	var target = '#cog_display_'+this.questionId;
    var set = this.currentSet;
    for (var i = 0; i <this.currentSet.length; i++) {
    	delayDisplay(i);
	}
    
    var id = this.questionId;
    setTimeout(function() {
    	$('#cog_input_'+id).prop('disabled',false);
    	$('#cog_submit_'+id).prop('disabled',false);
    	$('#cog_instr_'+id).text('Enter digits in increasing order');	
    	console.log('done showing');
        this.shown = true;
    }, 2200 + 1400*set.length); 
    
    function delayDisplay(i) {
        setTimeout(function(){$(target).html(set[i]);},1000 + 1400*i);
        setTimeout(function(){$(target).html('');},2000 + 1400*i);
    }
}

WorkingOrderTest.prototype.scoreResponse = function() {
	$('#cog_input_'+this.questionId).prop('disabled',true);
	$('#cog_submit_'+this.questionId).prop('disabled',true);
	var responses = $('#cog_input_'+this.questionId).val().split('');
	var answers = this.currentSet.sort();	
	for (var i=0;i<answers.length;i++) {
		if(answers[i] != responses[i]) this.score--;
	}
	this.next();
}

WorkingOrderTest.prototype.next = function() {
	if (this.score >0) {
		this.maxValue = this.currentCount;
		this.currentCount++;
		this.currentSet = this.generateSet();
        this.shown = false;
		//intructions + enable start.
		$('#cog_instr_'+this.questionId).text('Correct - Click Start.');
		$('#cog_start_'+this.questionId).prop('disabled',false);
	} else {
		//disable everything - and tell them they're done - send to server?
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
		$('#cog_instr_'+this.questionId).text('You are done. Score: ' + this.maxValue);
	}
}
