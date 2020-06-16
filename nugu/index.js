const uuid = require('uuid').v4;
const _ = require('lodash');
const { DOMAIN } = require('../config');

class Directive {
	constructor({type, audioItem}) {
	  this.type = type
	  this.audioItem = audioItem
	}
}
  
function audioPlayerDirective(soundFileName) {
	return new Directive({
		type: 'AudioPlayer.Play',
		audioItem: {
			stream: {
				url: `${DOMAIN}/` + soundFileName,
				offsetInMilliseconds: 0,
				token: uuid(),
				expectedPreviousToken: 'expectedPreviousToken',
			}
		}
	});
}

function stopDirective() {
	return {
		"type": 'AudioPlayer.Stop',
	};
}

function pauseDirective() {
	return {
		"type": 'AudioPlayer.Pause',
	};
}

function setAudioPlayTime(hour, minute) {
	let result = {};
	result.hour = 0;
	result.minute = 30;
	if(hour != undefined) result.hour = hour;
	if(minute != undefined) result.minute = minute;
	return result;
}

function getAudioPlayTime(hour, minute) {
	let time = hour + '시간 ' + minute + '분';
	if(hour <= 0) time = hour + '시간';
	if(minute <= 0) time = minute + '분';
	return time;
}

class NPKRequest {
	constructor (httpReq) {
		this.context = httpReq.body.context;
		this.action = httpReq.body.action;
		this.actionName = "";
		this.parameters = "";
		console.log(`NPKRequest: ${JSON.stringify(this.context)}, ${JSON.stringify(this.action)}`);
	}

	do(npkResponse) {
		this.actionRequest(npkResponse);
	}

	actionRequest(npkResponse) {
		console.log('actionRequest');
		console.dir(this.action);

		const actionName = this.action.actionName;
		const parameters = this.action.parameters;

		switch (actionName) {
			case 'StartMeditationAction':
				this.StartMeditationAction(parameters);
				break;
			case 'StartWhitenoiseAction':
				this.StartWhitenoiseAction(parameters);
				break;
			case 'StartSleepAction':
				this.StartSleepAction(parameters);
				break;
		}
	}

	// 명상 지도 서비스
	StartMeditationAction(params) {
		let result = {};
		let soundFileName = "wave_sound.mp3";
		console.log(params);

		// input 파라미터
		let {hour, minute} = setAudioPlayTime(params.meditation_playing_hour.value, params.meditation_playing_minute.value);
		console.log(params.meditation_playing_hour.value, params.meditation_playing_minute.value);

		// output 파라미터
		result.meditation_playing_time = getAudioPlayTime(hour, minute);
		npkResponse.setStartMeditationActionOutput(result);
		npkResponse.addDirective(audioPlayerDirective(soundFileName));
	}

	// 공부 도움 서비스
	StartWhitenoiseAction(params) {
		let result = {};
		let {hour, minute} = setAudioPlayTime(params.whitenoise_playing_hour, params.whitenoise_playing_minute);
		let soundFileName = "";

		switch (params.whitenoise_type) {
			case '카페소리':
				soundFileName = "wave_sound.mp3";
				break;
			case '파도소리':
				soundFileName = "wave_sound.mp3";
				break;
			case '빗소리':
				soundFileName = "wave_sound.mp3";
				break;
		}

		result.whitenoise_playingtime = getAudioPlayTime(hour, minute);
		result.whitenoise_type = params.whitenoise_type;
		npkResponse.setStartWhitenoiseActionOutput(result);
		npkResponse.addDirective(audioPlayerDirective(soundFileName));
	}

	// 수면 유도 서비스
	StartSleepAction(params) {
		let result = {};
		let soundFileName = "wave_sound.mp3";
		result.result = "오늘도 수고하셨어요. 4 7 8 호흡법을 통해 수면유도를 도와드릴게요.";
		npkResponse.setStartSleepActionOutput(result);
		npkResponse.addDirective(audioPlayerDirective(soundFileName));
	}
}

class NPKResponse {
	constructor () {
		console.log('NPKResponse constructor');

		this.version = '2.0';
		this.resultCode = 'OK';
		this.output = {};
		this.directives = [];
	}

	setAwnserLunchActionOutput(result) {
		console.log("*** set output parameters");
		this.output = {
			lunch_menu: result.lunch_menu,
			day_output: result.day_output
		}
	}

	setStartMeditationActionOutput(result) {
		console.log("*** set output parameters");
		this.output = result;
	}

	setStartWhitenoiseActionOutput(result) {
		console.log("*** set output parameters");
		this.output = result;
	}

	setStartSleepActionOutput(result) {
		console.log("*** set output parameters");
		this.output = result;
	}

	addDirective(directive) {
		this.directives.push(directive);
	}
}

const nuguReq = function(httpReq, httpRes, next) {
	npkResponse = new NPKResponse();
	npkRequest = new NPKRequest(httpReq);
	npkRequest.do(npkResponse);
	console.log(`NPKResponse: ${JSON.stringify(npkResponse)}`);

	setTimeout(()=> {
		console.log("*** end response");
		return httpRes.send(npkResponse);
	}, 500);
};

module.exports = nuguReq;