var User = require('./user.js').User;

var Message = function() {
    Message.super_.call(this);
};

require('util').inherits(Message, Object);

Message.createFromEvent = function(event, eventArguments, pipsqueek, callback) {
    var message = new Message();

    message.event = event;
    message.args = eventArguments;

    var senderRegex = /^(.*?)!(.*?)\@(.*?)$/;
    if (senderRegex.test(eventArguments[0])) {
        var matches = eventArguments[0].match(senderRegex);
        message.nick = matches[1];
        message.ident = matches[2];
        message.host = matches[3];
    }

    console.log(event, message);

    callback(message);

    /*
    my@recipients;#more than one argument sent ?
    if (defined($args[1])) {
        if (ref($args[1]) eq 'ARRAY') {
            if ($args[1] - > [0] = ~ / ^ [# & +!] / ) {
                $self - > channel($args[1] - > [0]);
            }

            foreach my $arg(@ {
                $args[1]
            }) {
                push(@recipients, $arg);
            }
        }
        else {#customized mode parsing

            #The above will
            catch most argument lists, #but there are quite a few(especially the irc_XXX#numeric events) that have arguments that require#special parsing

            if ($event eq 'irc_mode') {
                if ($args[1] = ~ / ^ [# & +!] / ) {
                    $self - > channel($args[1]);
                }
                else {
                    $self - > nick($args[1]);
                }

                if (defined($args[3]) && $args[3] ne "") {
                    $self - > recipients([@args[3..$#args]]);
                }
                else {
                    $self - > recipients([$args[1]]);
                }
            }
            elsif($event eq 'irc_353')#list of names upon entering a channel {
                my($channel, $names) = split(/:/, $args[1]);
                $channel = ~s / ^ .*[# & +!] / # / g;
                $channel = ~s / +$ //g;

                $self - > channel($channel);
                $self - > recipients([split(/ /, $names)]);
            }
            elsif($event eq 'irc_kick') {
                $self - > channel($args[1]);
                push(@recipients, $args[2]);
                $self - > message($args[3]);
            }
            elsif($event eq 'irc_join' || $event eq 'irc_part') {
                my($channel, $msg) = $args[1] = ~
                m / ^ ([# & +!].* ? )( ? : : (.*)) ? $ / ;
                $self - > channel($channel);
                $self - > message($msg);
            }
            elsif($event eq 'irc_332')#topic when joining the channel(or reply to / topic) {
                my($channel, $msg) = $args[1] = ~
                m / ^ ([# & +!].* ? )( ? : : (.*)) ? $ / ;
                $self - > channel($channel);
                $self - > message($msg);
            }
            elsif($event eq 'irc_333') {
                my($chan, $name, $time) = split(/\s+/, $args[1]);
                $self - > channel($chan);
                $self - > nick($name);
                $self - > message($time);
            }
            elsif($event eq 'irc_topic') {
                $self - > channel($args[1]);
            }
            else {
                $self - > message($args[1]);
            }
        }
    }

    if (@recipients) {
        $self - > recipients(@recipients);
    }

    #If we still have another argument, it 's the event'
    s message
    if (defined($args[2]) && !defined($self - > message())) {
        $self - > message($args[2]);
    }


    #is this message a command ? my $prefixed = $self - > _config() - > public_command_prefix();
    my $nickname = $self - > _config() - > current_nickname();
    my $c_answer = $self - > _config() - > answer_when_addressed();

    my $command = undef;
    my $c_input = undef;
    my $input = $self - > message();

    #!quote
    if ($prefixed && $input = ~ / ^ $prefixed / i) {
        $input = ~s / ^ $prefixed //i;

        ($command, $c_input) = $input = ~m / ^ (.* ? )( ? : \s + (.*)) ? $ / ;
    }#PipSqueek : !quote, PipSqueek : quote, or PipSqueek, quote
    elsif($c_answer && $input = ~ / ^ $nickname[: , ] / ) {
        $input = ~s / ^ $nickname[: , ]\s * //i;

        ($command, $c_input) = $input = ~m / ^ (.* ? )( ? : \s + (.*)) ? $ / ;

        $command = ~s / ^ $prefixed //;
    }#quote(privmsg only)
    elsif($self - > event() eq 'irc_msg') {
        ($command, $c_input) = $input = ~m / ^ (.* ? )( ? : \s + (.*)) ? $ / ;
    }
    elsif($self - > event() = ~m / ^ private_ / ) {
        ($command, $c_input) = $input = ~m / ^ (.* ? )( ? : \s + (.*)) ? $ /
    }


    if ($command) {
        $self - > is_command($command);
        $self - > command($command);
        $self - > command_input($c_input);
    }

    return 1;
    */
}

Message.prototype.reply = function(text) {
    pipsqueek.say(text, this.channel ? this.channel : this.sender);
};

Message.prototype.respond = function(text) {
    this.reply(this.sender + ': ' + text);
};

Message.prototype.replyAct = function(text) {
    pipsqueek.act(text, this.channel ? this.channel : this.sender);
};

Message.prototype.ctcpReply = function(text) {
    pipsqueek.ctcpReply(text, this.channel ? this.channel : this.sender);
};

exports.Message = Message;
