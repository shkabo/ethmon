
// Default web refresh interval (may be changed with web_refresh config option)
var refresh = 5000;

// Wallet API refresh interval to 1 minute
var api_refresh = 60000;

// Default hashrate tolerance (+/- to target hashrate)
var tolerance = 0.05;

// GPU temperature monitoring threshold (zero disables monitoring)
var temperature = 0;

// Title animation index
var animation_index = 0;

// DOM Ready =============================================================

$(document).ready(function() {
    worker();
    wallet();
    
});

// Functions =============================================================

function worker() {
    var eth = [ 0, 0, 0 ];

    function format_stats(stats, currency, target, splitter, skip) {
        if (!skip && stats) {
            if (!splitter) {
                splitter = '';
            }

            var s = stats.split(';');

            var result = [];
            result.error = false;
            result.hash = '';
            
            // Update totals
            if (currency !== null) {
                currency[0] += Number(s[0]);
                currency[1] += Number(s[1]);
                currency[2] += Number(s[2]);
            }

            // Format fields
            var hashrate = Number(s[0] / 1000).toFixed(2) + '&nbsp;MH/s';
            var shares = s[1] + '/' + s[2];
            var rejects = (s[1] > 0) ? ('&nbsp;(' + Number(s[2] / s[1] * 100).toFixed(2) + '%)') : '';

            // Check tolerance
            if ((target !== null) && tolerance) {
                // hash rate is lower than our target - tolerance %
                // throw warning on this .. something is not working as it should
                if (s[0] / 1000 < target * (1 - tolerance)) {
                    hashrate = '<b>' + hashrate + '</b>';
                    result.error = true;
                } else if (s[0] / 1000 > target * (1 + tolerance)) {
                    // this is all good, our hash rate is higher than our target + tolerance %
                    hashrate = '<b>' + hashrate + '</b>';
                }
            }

            result.hash = hashrate + splitter + shares + rejects;
            return result;
        }
        return result;
    }

    function format_temps(temps, splitter, ti) {
        if (!splitter) {
            splitter = ' ';
        }
        var tf = '';
        if (temps) {
            var t = temps.split(';');
            var tnum = ti ? ti.length : (t.length / 2);
            for (var i = 0; i < tnum; ++i) {
                var j = (ti ? ti[i] : i) * 2;
                var temp = t[j] + 'C';
                var fan = t[j + 1] + '%';
                if (temperature && (t[j] > temperature)) {
                    temp = '<span class="text-danger">' + temp + '</span>';
                }

                if (typeof t[j] === 'undefined') {
                    tf += ((i > 0) ? splitter : '') + '<span class="text-danger">Not readable</span>';
                } else {
                    tf += ((i > 0) ? splitter : '') + temp + ':' + fan;
                }
                
            }
        }
        return tf;
    }

    function format_hashrates(hr, splitter, skip) {
        if (!splitter) {
            splitter = ' ';
        }
        var hashrates = '';
        if (!skip && hr) {
            var h = hr.split(';');
            for (var i = 0; i < h.length; ++i) {
                hashrates += ((i > 0) ? splitter : '') + (Number(h[i] / 1000).toFixed(2) + '&nbsp;MH/s');
            }
        }
        return hashrates;
    }

    function format_pools(pools, splitter) {
        if (!splitter) {
            splitter = '; ';
        }
        return pools.split(';').join(splitter);
    }

    $.ajax({
        url: '/miners',

        success: function(data) {
            // Target hashrate tolerance
            if (data.tolerance !== undefined) {
                tolerance = data.tolerance / 100;
            }

            // GPU temperature monitoring threshold
            if (data.temperature !== undefined) {
                temperature = data.temperature;
            }

            // For each item in JSON, add a table row and cells to the content string
            var warning = { msg: null, last_good: null };
            var error = { msg: null };

            var tableContent = '';
            $.each(data.miners, function (index, miner) {
                if (miner !== null) {
                    var stats = format_stats(miner.eth, eth, miner.target_eth, '<br>');
                    var error_class = (miner.error === null && stats.error === false) ? '' : ' class="warning"' ;
                    var span = (data.hashrates) ? 6 : 5;
                    
                    tableContent += '<tr' + error_class + '>';
                    tableContent += '<td>' + miner.name + '</td>';
                    tableContent += '<td>' + miner.host + '</td>';

                    if (miner.warning) {
                        // Only single last good time is reported for now
                        warning.msg = miner.warning;
                        warning.last_good = miner.last_good;
                    }

                    if (miner.error) {
                        error.msg = miner.error;
                        last_seen = '<br>Last seen: ' + miner.last_seen;
                        tableContent += '<td colspan="' + span + '" class="text-danger text-center">' + miner.error + last_seen + '</td>';
                    } else if (miner.offline) {
                        tableContent += '<td colspan="' + span + '" class="text-danger text-center"> Miner is set offline in configuration </td>';
                    } else {
                        tableContent += '<td>' + miner.uptime + '</td>';
                        tableContent += '<td>' + stats.hash + '</td>';
                        if (data.hashrates) {
                            tableContent += '<td>' + format_hashrates(miner.eth_hr, '<br>') + '</td>';
                        }
                        tableContent += '<td>' + format_temps(miner.temps, '<br>', miner.ti) + '</td>';
                        tableContent += '<td>' + format_pools(miner.pools, '<br>') + '</td>';
                        tableContent += '<td>' + miner.ver + '</td>';
                    }
                    tableContent += '<td>' + miner.comments + '</td>';
                    tableContent += '</tr>';
                }
            });

            // Inject the whole content string into existing HTML table
            $('#minerInfo table tbody').html(tableContent);

            // Update window title and header with hashrate substitution
            var title = data.title.replace('%HR%', Number(eth[0] / 1000).toFixed(0));
            if (error.msg !== null) {
                title = 'Error: ' + title;
            } else if (warning.msg !== null) {
                title = 'Warning: ' + title;
            }
            if (data.animation) {
                var c = data.animation[animation_index];
                animation_index = (animation_index + 1) % data.animation.length;
                title = title.replace('%ANI%', c);
            }
            if ($('title').html() !== title) {
                $('title').html(title);
            }

            var header = data.header.replace('%HR%', Number(eth[0] / 1000).toFixed(0));
            if ($('#minerInfo h2').html() !== header) {
                $('#minerInfo h2').html(header);
            }

            // Update summary
            var summaryContent = '';
            var hashrate = format_stats(eth.join(';'), null, null, ', ');
            summaryContent += 'Total ETH hashrate: ' + hashrate.hash;
            
            $('#minerSummary').html(summaryContent);

            // Display last update date/time and warning message
            var lastUpdated = 'Last updated: ' + data.updated;
            $('#lastUpdated').html(lastUpdated).removeClass("error");

            $('#warningmsg').html('<br>');
            if (warning.msg !== null) {
                $('#warningmsg').html('<span class="text-danger text-center">' + warning.msg + ', last seen good: ' + warning.last_good + '</span>');
            }

            // Update refresh interval if defined
            if (data.refresh !== undefined) {
                refresh = data.refresh;
            }
        },

        error: function() {
            // Mark last update time with error flag
            $('#lastUpdated').addClass("error");
            $('title').html('FATAL: No response from server');
        },

        complete: function() {
            // Schedule the next request when the current one's complete
            setTimeout(worker, refresh);
        }

    });
}

// Dsisplay wallet info on the page
function wallet() {
    function format_balance(balance){
        // eth balance has 18 decimals
        var decimal = balance.slice(-18);
        // format non decimal part of the value - separate thousands by ,
        var non_decimal = balance.slice(0, balance.length - 18).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return non_decimal + "." + decimal;
    }

    if ($('.wallet').length > 0 && $('.wallet')) {
        $.ajax({
            url: 'https://api.etherscan.io/api?module=account&action=balance&address=' + $('.wallet').text(),

            success: function(data) {
                
                // if we didn't get good response, display error
                if (data.status !== "1") {
                    $('#wallet-balance').text("We couldn't fetch the data ...");
                    $('#wallet-balance').addClass('text-warning');
                }
                // we're all good
                if (data.status === "1") {     
                    // check current class of element and remove it
                    // we only yse it to display the error ;)
                    var element_classes = $('#wallet-balance').prop('class');                    
                    if (element_classes.length > 0) {
                        $('#wallet-balance').removeClass();
                    }
                    // we'll pass data to the coinbase api call and merge all together
                    // process it and pack it up nicely for the user
                    // in other way we skip 'flickering' of the current eth value on the page (2 different calls, 2x page update)
                    coinbase( format_balance(data.result) );
                }
            },

            error: function() {
                // remove all classes, add warning class and display error message
                $('#wallet-balance').removeClass().addClass('text-warning').text("We couldn't fetch the data ...");
            },
            
            complete: function() {
                // set timer to rerun the call 
                setTimeout(wallet, api_refresh);
            }
        });
    }
}

// get current ETH value
function coinbase( eth_balance ) {
    // save our balance so we can display it later
    this.eth_balance = eth_balance;

    //update display balance on the page
    function calculate_balance(eth) {
        // if we have balance, let's do the math :)
        if (typeof(this.eth_balance) !== 'undefined') {
            // our ether * eth value 
            var balance = (this.eth_balance * (1/eth)).toFixed(2);
            var eth_usd = (1/eth).toFixed(2); 
            // display data to the user
            $('#wallet-balance').html( this.eth_balance + ' ETH - <b>$' + balance + '</b> <span class="tiny">(@ $' + eth_usd + '/ETH)</span>');
        }
    }
    $.ajax({
        'url': "https://api.coinbase.com/v2/exchange-rates",
        success: function(data) {
            // if we have ether rate, let's process it
            if (typeof data.data.rates.ETH !== 'undefined') {
                calculate_balance(data.data.rates.ETH);
            }
        },
        error: function() {
            // if we fail to get response from API for some unknown reason,
            // we at least want to display the current balance of our wallet
            // it's better than nothing
            if (typeof(this.eth_balance) !== 'undefined') {
                $('#wallet-balance').html( this.eth_balance + ' ETH' );
            }
        }
    });
}