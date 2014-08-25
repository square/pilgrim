## Pilgrim

Pilgrim is a one page application that provides documentation for protocol buffers. It is compiled into a static site by [middleman](https://github.com/middleman/middleman).

This application does not upload your bundle to the server and relies on CORS to fetch proto bundles.

### Creating your own proto bundle

Proto bundles are created with [protob](https://github.com/square/protob).

### How to use?

Serve pilgrim/build from your favourite web-server.

To fetch your own proto bundle, use [pilgrimize](https://github.com/hassox/pilgrimize).

* Create a protos.json file to specify your dependencies
* Install pilgrimize npm install -g pilgrimize
* Run pilgrimize in the same directory as your protos.json file

For example. To run your own bundle of the marvel comics api, protos.json:

    [
      { "git": "https://github.com/hassox/google-protos.git" },
      { "git": "https://github.com/hassox/fender.git" },
      { "git": "https://github.com/hassox/marvel-protos.git" }
    ]

Then:

    $ npm install -g pilgrimize
    $ pilgrimize

Then head over to [pilgrim](http://localhost:4567)
