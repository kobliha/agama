#!/bin/bash

[ -e /dracut-state.sh ] && . /dracut-state.sh

. /lib/dracut-lib.sh
. /lib/net-lib.sh

ifcfg_to_ip() {
  local ip
  local conf_path="/etc/cmdline.d/40-agama-network.conf"
  if [ -n "$2" ]; then
    local v="${2}",
    local interface="$1"
    set --
    while [ -n "$v" ]; do
      set -- "$@" "${v%%,*}"
      v=${v#*,}
    done
  else
    local interface="*"
  fi

  ### See https://en.opensuse.org/SDB:Linuxrc#Network_Config
  # ifcfg=<interface_spec>=[try,]dhcp*,[rfc2132,]OPTION1=value1,OPTION2=value2...
  if str_starts "$1" "dhcp"; then
    autoconf="$1"
    if [ "$autoconf" = "dhcp4" ]; then
      autoconf="dhcp"
    fi
    case $autoconf in
    "dhcp" | "dhcp6")
      if [ "$interface" = "*" ]; then
        echo "ip=${1}" >>$conf_path

      else
        echo "ip=${interface}:${1}" >>$conf_path
      fi
      ;;
    *)
      echo "No supported option ${1}"
      ;;
    esac

    return 0
  fi

  # ifcifg=<interface_spec>=ip,gateway,nameserver,domain
  if strglob "$1" "*.*.*.*/*"; then
    [[ -n "$2" ]] && gateway=$2
    [[ -n "$3" ]] && nameserver=$3

    ip="$1 "
    set --
    while [ -n "$ip" ]; do
      set -- "$@" "${ip%% *}"
      ip="${ip#* }"
    done

    ## TODO: IP is a LIST_IP
    ip="$1"
    mask=${ip##*/}
    ip=${ip%%/*}
    shift

    ## Configure the first interface, the gateway must belong to the same network
    echo "ip=${ip}::${gateway}:$mask::${interface}" >>$conf_path

    ## Configure multiple addresses for the same interface
    while [[ $# -gt 0 ]]; do
      ip="$1"
      mask=${ip##*/}
      ip=${ip%%/*}
      echo "ip=${ip}:::$mask::${interface}" >>$conf_path
      shift
    done

    ## Configure nameservers
    if [[ -n $nameserver ]]; then
      nameserver="$nameserver "
      while [ -n "$nameserver" ]; do
        echo "nameserver=${nameserver%% *}" >>$conf_path
        nameserver="${nameserver#* }"
      done
    fi
  fi

  return 0
}

parse_hostname() {
  local hostname

  hostname=$(getarg hostname=)

  if [[ -n $hostname ]]; then
    echo "${hostname}" >/etc/hostname
  fi
  return 0
}

translate_ifcfg() {
  local i
  local vlan
  local phydevice
  local conf_path="/etc/cmdline.d/40-agama-network.conf"

  while read -r i; do
    set --
    echo "### Processing $i ###"
    set -- "$@" "${i%%=*}"
    options="${i#*=}"
    pattern="$1"
    unset vlan phydevice

    if str_starts "$options" "try,"; then
      options="${i#*try,*}"
    fi

    # The pattern Looks like a VLAN like eth0.10
    if strglobin "$pattern" "*.[0-9]*"; then
      phydevice=${pattern%.*}
      vlan="vlan=$1:$phydevice"
      echo "$vlan" >>$conf_path
    fi

    # Try to translate the pattern as it is, we cannot try to apply the config to check if
    # it is valid because the nm-initrd-generator is called by a cmdline hook unless we call
    # explicitly passing the getcmdline result
    ifcfg_to_ip "$pattern" "$options"

    set --
    unset options pattern CMDLINE
  done <<<"$(getargs ifcfg)"

  return 0
}

translate_ifcfg
parse_hostname
