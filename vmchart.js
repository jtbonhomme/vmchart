var Chart = require('cli-chart');

var exec = require('child_process').exec,
    child_ps, child_vmrss;

var STB_IP          = "10.0.1.30";
var PROG_NAME       = "uwsgi";
var MEMORY_TYPE     = "VmRSS";
var data = [];
var max = 0;

var start_measure = function(pid, memory_type) {

    this.memory_type = memory_type;
    this.pid = pid;
    // read /proc/pid/status file to get memory value
    child_vmrss = exec("ssh root@"+STB_IP+" 'cat /proc/"+this.pid+"/status'|grep "+this.memory_type+"|awk '{print $2}'",
        function (error, stdout, stderr) {
            // get memory value and remove trailing CRLF
            this.memory_measurement = stdout.replace(/\s+$/, '');
            console.log(this.memory_type+' : ' + this.memory_measurement);
            if (error !== null) {
                console.log('exec error: ' + error);
                process.exit();
            }
            var i;
            data.push(this.memory_measurement);
            if( this.memory_measurement > max ) {
                max = this.memory_measurement;
            }
            console.log("Max "+this.memory_type+" = " + max);
            var chart = new Chart({width: 120, height: 20, direction: 'y', xlabel:'time (x 5s)', ylabel:'mem (B)', ymax: '400', step: '2'});
            for( i = ((data.length > 60) ? (data.length - 60) : 0 ) ; i < data.length ; i++) { 
                chart.addBar({size:data[i]});
            }
            chart.draw();
            delete(chart);
            // schedule the next memory measurement in 5 secondw
            setTimeout(start_measure, 5000, this.pid, this.memory_type);
        });
};

child_ps = exec("ssh root@"+STB_IP+" 'ps aux'|grep "+PROG_NAME+"|awk '{print $1}'",
    function (error, stdout, stderr) {
        // get PID value, and suppress trailing CRLF
        this.pid = stdout.replace(/\s+$/, '');
        console.log(PROG_NAME+' PID : ' + this.pid);
        if (error !== null) {
            console.log('exec error: ' + error);
            process.exit();
        }
        // start measuring vm rss
        start_measure(this.pid, MEMORY_TYPE);
    });


