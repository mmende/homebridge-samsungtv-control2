# Homebridge-SamsungTV-Control

This plugin adds SamsungTVs available in your local network to homebridge. Just install the plugin in the Homebridge UI in the Plugin tab, turn on all your Samsung TV's so they can be discovered and restart homebridge. You might need to allow pairing on your TV while homebridge tries to pair for the first time with the TV.

# Add TV's to home app

There is a homekit limitation that allows only one TV per bridge. Therefore each TV will be exposed as external accessory and will not show up when only the homebridge-bridge was added. To add each of your Samsung TV's

1. Open the Home App
2. Type `+` in the top right corner to add a device
3. Then click on **Don't Have a Code or Can't scan?**
4. The found TV should appear under **Nearby Accessories** ... click on it
5. Use the pin that you configured under `config > bridge > pin`

# Turning a TV on

Some Samsung TV's (actually all I was able to test) turn off their network card when being turned off completely. Therefore these models cannot be turned on again by this plugin since they are just not reachable over the network. However some newer models might support Wake-on-LAN or Wake-on-WIFI which this plugin tries to use to turn your TV back on.
