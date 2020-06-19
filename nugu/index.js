const uuid = require('uuid').v4;
const _ = require('lodash');
const { DOMAIN } = require('../config');
const mysql = require("mysql");
const db = mysql.createConnection({
	host: 'localhost',
	user: 'yy_10122',
	password: 'asdf1234',
	database: 'yy_10122'
});
db.connect();

class Directive {
	constructor({type, audioItem}) {
	  this.type = type;
	  this.audioItem = audioItem;
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

function setAudioPlayTime(hour, minute) {
	let result = {};
	result.hour = hour;
	result.minute = minute;
	if(hour == 0 && minute == 0) result.minute = 30;
	return result;
}

function getAudioPlayTime(hour, minute) {
	let time = "";
	if(hour > 0) time = `${hour}시간`;
	if(minute > 0) time += ` ${minute}분`;
	return time;
}

function getScoreOutput(yesterday_score, now_score) {
	let msg = '오늘 명상 점수는';

	if(now_score > yesterday_score) {
		msg += `${now_score}으로 가장 최근의 명상점수인 ${yesterday_score}보다 좋아졌네요.`;
	} else {
		msg += `${now_score}으로 가장 최근의 명상점수인 ${yesterday_score}보다 낮아졌네요.`;
	}

	return msg;
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
			case 'RecordMeditationAction':
				this.RecordMeditationAction(parameters);
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
		// input 파라미터
		let {hour, minute} = setAudioPlayTime(params.meditation_playing_hour.value, params.meditation_playing_minute.value);
		// output 파라미터
		result.meditation_playing_time = getAudioPlayTime(hour, minute);
		npkResponse.setActionOutput(result);
		npkResponse.addDirective(audioPlayerDirective(soundFileName));
	}

	// 명상 지도 끝난 후 만족도 서비스
	RecordMeditationAction(params) {
		let result = {};
		let score = params.score.value;
		console.log(`\n\n\n\n\n\n\n\n\n\n\n\n\n\n${score}\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n`);

		let sql = "INSERT INTO mantra_meditation (score, create_date, user_id) VALUES (?, now(), ?)";

		db.query(sql, [score, 1], function(err, result) {
			if(err) {
				console.log(err);
			} else {
				console.log(result);

				db.query("SELECT score FROM mantra_meditation WHERE user_id = ? ORDER BY create_date DESC LIMIT 1", [1], function(err, result) {
					result.output = getScoreOutput(result, score);
					npkResponse.setActionOutput(result);
				});
			}
		});
	}

	// 공부 도움 서비스
	StartWhitenoiseAction(params) {
		let result = {};
		let {hour, minute} = setAudioPlayTime(params.whitenoise_playing_hour.value, params.whitenoise_playing_minute.value);
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
		result.whitenoise_type = params.whitenoise_type.value;
		npkResponse.setActionOutput(result);
		npkResponse.addDirective(audioPlayerDirective(soundFileName));
	}

	// 수면 유도 서비스
	StartSleepAction(params) {
		let soundFileName = "wave_sound.mp3";
		npkResponse.addDirective(audioPlayerDirective(soundFileName));
	}
}

class NPKResponse {
	constructor () {
		this.version = '2.0';
		this.resultCode = 'OK';
		this.output = {};
		this.directives = [];

		console.log('NPKResponse constructor');
	}

	setActionOutput(result){
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