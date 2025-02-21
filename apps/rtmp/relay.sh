#!/bin/bash

# ./relay.sh $name $app
# this script will take in the $name
# send it to the controller api which will
# generate a list of destinations to send the stream
# and return a comma separated list.

# kill all children when we get a sigterm
on_die() {
  pkill -KILL -P $$
}

# get a list of commands to push the video
push_command=$(curl -s "http://0.0.0.0:3000?key=$1&name=$2&args=$3")

# when we get a term, kill any sub processes we spawn
trap 'on_die' TERM

# loop through each command, decode it
# and then eval it
eval "$push_command"

wait
