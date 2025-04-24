# Simple test for server routes

WEBSITE=http://localhost:3333
WEBSITE_API=$WEBSITE/api

get_status_code() {
  for url in "$@"; do
    status_line=$(curl -s -o /dev/null -D - "$url" | head -n 1)
    echo "$url GET :: $status_line"
  done
}

post_and_get_status() {
  local url="$1"
  shift

  status_line=$(curl -s -o /dev/null -D - "$@" -X POST "$url" | head -n 1)
  echo "$url POST :: $status_line"
}

# Anonymous user cannot neither get or update website settings (Allowed ips or tokens)
post_and_get_status "$WEBSITE_API/website-settings" \
  -H "Content-Type: multipart/form-data" \
  -F "allowed_ip_addresses[]=bad_ip" \
  -F "access_tokens[]=bad_token"

get_status_code $WEBSITE_API/website-settings
get_status_code $WEBSITE_API/user-files
get_status_code $WEBSITE_API/auth
post_and_get_status $WEBSITE_API/auth
get_status_code $WEBSITE/d/123