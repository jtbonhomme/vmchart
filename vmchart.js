var Chart = require('cli-chart');

var exec = require('child_process').exec,
    child_ps, child_vmrss, child_cols;

var STB_IP          = "10.0.1.30";
var PROG_NAME       = "qtwebkitlauncher";
//var PROG_NAME       = "uwsgi";
var MEMORY_TYPE     = "VmRSS";
var INTERVAL_SEC = 1;

var data = [];
var max = 0;

var start_measure = function(pid, memory_type, cols) {
    this.memory_type = memory_type;
    this.cols = cols;
    this.pid = pid;
    // read /proc/pid/status file to get memory value
    child_vmrss = exec("ssh root@"+STB_IP+" 'cat /proc/"+this.pid+"/status'|grep "+this.memory_type+"|awk '{print $2}'",
        function (error, stdout, stderr) {
            // get memory value and remove trailing CRLF
            this.memory_measurement = stdout.replace(/\s+$/, '');
            console.log('Current '+this.memory_type+'\t: ' + this.memory_measurement);
            if (error !== null) {
                console.log('exec error: ' + error);
                process.exit();
            }
            var i;
            data.push(this.memory_measurement);
            if( this.memory_measurement > max ) {
                max = this.memory_measurement;
            }
            console.log("Max "+this.memory_type+"\t: " + max);
            var chart = new Chart(  {
                                        width: (this.cols - 20), 
                                        height: 20, 
                                        direction: 'y', 
                                        xlabel:'time (x '+INTERVAL_SEC+'s)', 
                                        ylabel:'memory\n(Bytes)', 
                                        ymax: '100000', 
                                        step: '2'
                                    });
            // display the last width/2 values
            var nvalues = Math.floor( ( this.cols - 20 ) / 2 ); 
            for( i = ((data.length > nvalues) ? (data.length - nvalues) : 0 ) ; i < data.length ; i++) {
                var barcolor = 'blue';
                if( data[i] <= 10000 ) {
                    barcolor = 'white';
                }
                else if( data[i] > 10000 && data[i] <= 20000 ) {
                    barcolor = 'blue';
                }
                else if( data[i] > 20000 && data[i] <= 30000 ) {
                    barcolor = 'green';
                }
                else if( data[i] > 30000 && data[i] <= 40000 ) {
                    barcolor = 'red';
                }
                else if( data[i] > 40000 && data[i] <= 50000 ) {
                    barcolor = 'black';
                }
                
                chart.addBar({size:data[i], color:barcolor});
            }
            // display all values in a bucket
            // chart.bucketize(data);

            chart.draw();
            delete(chart);
            // schedule the next memory measurement in 5 secondw
            setTimeout(start_measure, (INTERVAL_SEC * 1000), this.pid, this.memory_type);
        });
};

var get_pid = function(cols) {
    this.cols = cols;
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
            start_measure(this.pid, MEMORY_TYPE, this.cols);
        });
}
var myArgs = process.argv.slice(2);
var j = 0;
var cols = 120;

while(j<myArgs.length) {
    switch (myArgs[j++]) {
        case '-w':
            console.log('Open chart with width = ' + myArgs[j]);
            if (cols < 80 ) {
                console.log("Please, enlarge your terminal window before launching this tool ...");
                process.exit();
            }
            cols = myArgs[j++];
            break;
        default:
            console.log('Unknown parameter');
    }
}

// get pid of the program
get_pid(cols);


