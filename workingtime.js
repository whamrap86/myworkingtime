var days = ["월","화","수","목","금"];
var dateCols = document.getElementsByClassName('date');
var selectors = document.getElementsByTagName("select");
var inputs = document.getElementsByTagName("input");
var workingtimes = document.getElementsByClassName('workingtime');
var etcs = document.getElementsByClassName('etc');
var totalHoursToWork = 40;
var totalHoursWorked = 0 ;

// 출퇴근 시간, 제외시간, 쉬는날 정보가 바뀌면
for(var i=0, len=inputs.length ; i<len ; i++) {
    inputs[i].addEventListener('change', inputHandler(i));
//    inputs[i].addEventListener('change', inputHandler(i));
}


for(i=0, len=days.length ; i<len ; i++) {
  selectors[i].addEventListener('change', selectHandler(i));
}

document.addEventListener('DOMContentLoaded', function(){
    // 오늘 날짜를 읽고
    var curDate = new Date();
    var d = curDate.getDate();
    var dw = curDate.getDay();
    var startDate = 0, tempDate=0 ;
    // 이번주 월요일 날짜(startDate)를 구하기
    if ( dw == 0 ) {
        // 오늘이 일요일이면 월요일은 d+1
        startDate = d+1;
    } else if ( dw == 1 ) {
        // 오늘이 월요일이면 d
        startDate = d;
    } else {
        // 오늘이 다른 요일이면 월요일은 d-dw+1
        startDate = d-dw+1;
    }
    updateTable(startDate, d);
    updateContents(startDate);
});

function updateTable(startDate, d) {
    tempDate = startDate;
    for(var i=0, len=days.length ; i<len ; i++) {    
        // 날짜 컬럼에 날짜와 요일을 넣고
        dateCols[i].innerText = '11/' + tempDate + '(' + days[i] + ')' ;        
        if ( tempDate > d ) {
            // 오늘 이후 항목은 disable 처리
            inputs[i*3].disabled = true;
            inputs[i*3+1].disabled = true;
            inputs[i*3+2].disabled = true;
        }
        tempDate ++;
    }
}

function updateContents(startDate) {
    var date = new Date();
    var y = date.getFullYear();
    var m = date.getMonth()+1;
    var d = date.getDate();

    var storage = localStorage ;
    var lastsavedtime = storage.getItem('LastSavedTime');

    if (lastsavedtime) {
        var lastDate = new Date(lastsavedtime);
        if ( lastDate.getDate() >= startDate ) {
        // 이번주 꺼면 반영하고
            for(i=0, len=days.length ; i<len ;i++) {
                var item = storage.getItem(days[i]);
                if (item) {
                    var obj = JSON.parse(item);
                    // 근무시간 업데이트하고, 입력된 값에 에러는 없는지 반영

                    inputs[i*3].value = obj.startTime;
                    inputs[i*3+1].value = obj.endTime;
                    inputs[i*3+2].value = obj.exceptionalTime;
                    selectors[i].selectedIndex = obj.workingType;

                    var h = (obj.startTime).substr(0,2);
                    var min = (obj.startTime).substr(3,2);
                    var startTime = new Date(y,m,d, parseInt(h), parseInt(min), 0);

                    h = (obj.endTime).substr(0,2);
                    min = (obj.endTime).substr(3,2);
                    var endTime = new Date(y,m,d, parseInt(h), parseInt(min), 0);

                    var diffMin = Math.round((endTime.getTime()-startTime.getTime())/60000) - parseInt(obj.exceptionalTime);
                    var hour = Math.round(diffMin/60);
                    var min = Math.round(diffMin%60);

                    if ( hour < 4 ) {
                        etcs[i].innerText = "근무시간 미달";
                    } else if ( hour >= 4 && hour < 9 ) {
                        if ( min < 30) {
                            hour--;
                            min = 60 - ( 30-min );
                        } else {
                            min -= 30;
                        }
                    } else if (hour>=9)  {
                        hour--;
                    }

                    workingtimes[i].innerText = hour + 'h ' + min + 'm';
                }
            }   
            var localstr = lastDate.toLocaleString();
            document.getElementById('lasttime').innerText = '마지막 저장시간 : ' + localstr ;
        } else {
            // 지난주 꺼면 지워버리고
            storage.clear();
        }
    }
}

function inputHandler(i) {
  var type = inputs[i].type ; // .target.type;
  var name = inputs[i].name ;  

  var bError = false ;
  var startTime, endTime, exceptionalTime, status, sHour, sMin, eHour, eMin ;
  var idx = i%3;

  status = selectors[idx].selectedIndex;

  if ( idx == 0 ) { // startTime
    startTime = inputs[idx].value ;
    endTime = inputs[idx+1].value ;
    exceptionalTime = inputs[idx+2].value;
  } else if ( idx == 1 ) { // endTime
    startTime = inputs[idx-1].value ;
    endTime = inputs[idx].value ;
    exceptionalTime = inputs[idx+1].value;
  } else { // exceptional time
    startTime = inputs[idx-2].value ;
    endTime = inputs[idx-1].value ;
    exceptionalTime = inputs[idx].value;
  }

  sHour = parseInt(startTime.substr(0,2));
  sMin = parseInt(startTime.substr(3,2));
  eHour = parseInt(endTime.substr(0,2));
  eMin = parseInt(endTime.substr(3,2));

  var bError = false ;

  // 출근보다 퇴근시간이 빠른지
  if ( eHour*60 + eMin < sHour*60 + sMin ) {
    etcs[idx].innerText = "퇴근이 출근보다 빠르네.";
    bError = true ;
  }
  // 근무시간보다 제외시간이 더 크면 입력 에러 처리
  else if ( (eHour*60+eMin)-(sHour*60+sMin) < exceptionalTime ) {
    etcs[idx].innerText = "예외시간이 근무시간보다 많네";
    bError = true ;
  }
  // 근무시간이 4시간 이하면 기타란에 특이사항 기입
  else if ( ((eHour*60+eMin)-(sHour*60+sMin)-exceptionalTime)/60 < 4 ) {
    etcs[idx].innerText = "4시간 미만 근무네.";
  }
  else {
    etcs[idx].innerText = '';
  }
      
  // 근무시간을 상단 바에 반영
  if(bError) {
    workingtimes[idx].innerText = 'NG';
  } else {
    var wHour = eHour-sHour ;
    var wMin = eMin-sMin ;

    if (wMin<0) {
      wHour--;
      wMin = eMin+60-sMin;
    } 

    if ( wHour < 4 ) {
      etcs[idx].innerText = "근무시간 미달";
    } else if ( wHour >= 4 && wHour < 9 ) {
      if ( wMin < 30) {
        wHour--;
        wMin = 60 - ( 30-wMin );
      } else {
      wMin -= 30;
      }
    } else if (wHour>=9)  {
      wHour--;
    } 

    workingtimes[idx].innerText = wHour + 'h ' + wMin + 'm';
  }
}

function selectHandler(i) {
  // 전체 근무기준시간 업데이트
  totalHoursToWork = 0;
  for(var i=0, len=days.length ; i<len ; i++) {
    if ( selectors[i].selectedIndex == 0 )
      totalHoursToWork += 8;
    else if ( selectors[i].selectedIndex == 2 )
      totalHoursToWork += 4;
    else
      ;
  }
  // 상단 바 업데이트
  updateProgressBar();
  
}

function updateProgressBar(hour) {
  var elem = document.getElementById('progress');
  var width = 1;
  var id = setInterval(frame, 10);
  function frame() {
    if(width>100) {
      clearInterval(id);
    } else {
      width++;
      elem.style.width = width + '%';
    }
  }
}

document.getElementById('btn_save').addEventListener('click', function(){
  var storage = localStorage ;

  var dailyData = {
      startTime : '',
      endTime :'',
      exceptionalTime : 0,
      workingType : 0
  };  

  for(var i=0, len=days.length ; i<len ; i++) {

      if(workingtimes[i].innerText === 'NG') {
        alert("입력 오류를 확인해라");
        return;
      }
      dailyData.startTime = inputs[i*3].value;
      dailyData.endTime = inputs[i*3+1].value;
      dailyData.exceptionalTime = inputs[i*3+2].value;
      dailyData.workingType = selectors[i].selectedIndex;
      var jsonData = JSON.stringify(dailyData);
      storage.setItem(days[i], jsonData);
  }

  var datetime = new Date();
  var localstr = datetime.toLocaleString();
  document.getElementById('lasttime').innerText = '마지막 저장시간 : ' + localstr ;

  var jsonString = datetime.toJSON();
  storage.setItem('LastSavedTime', jsonString);
});