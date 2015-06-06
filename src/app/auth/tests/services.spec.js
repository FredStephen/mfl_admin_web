(function () {

    "use strict";

    describe("Test auth login service: ", function () {
        var url;

        beforeEach(function () {
            module("mflAdminAppConfig");
            module("sil.api.wrapper");
            module("mfl.auth.services");
        });

        beforeEach(inject(["SERVER_URL", function (s) {
                url = s;
            }
        ]));

        afterEach(function () {
            inject(["$window", function ($window) {
                $window.localStorage.removeItem("auth.user");
            }]);
        });

        it("should have auth login service defined",
        inject(["mfl.auth.services.login", function (loginService) {
            expect(loginService).toBeDefined();
        }]));

        it("should have all the methods defined",
        inject(["mfl.auth.services.login", function (loginService) {
            expect(angular.isFunction (loginService.login)).toBeTruthy();
            expect(angular.isFunction (loginService.currentUser)).toBeTruthy();
            expect(angular.isFunction (loginService.isLoggedIn)).toBeTruthy();
        }]));
        it("should send user details to login Api: successfully",
        inject(["api.oauth2", "mfl.auth.services.login",
            function (oauth2, loginService) {
            var test_data = {
                username: "owagaantony@gmail.com",
                password: "owaga"
            };
            spyOn(oauth2, "fetchToken").andReturn({});

            var response = loginService.login(test_data);

            expect(response).toEqual({});
        }]));
        it("should send user details to login Api: successfully",
        inject(["$httpBackend","mfl.auth.services.login",
            function ($httpBackend, loginService) {
            var test_data = {
                email: "owagaantony@gmail.com",
                username: "owaga"
            };
            var test_response = JSON.stringify(test_data);
            $httpBackend.expect(
                "GET",url + "api/rest-auth/user/").respond(
                200, test_response);
            var response = loginService.currentUser();
            response.then(function (data) {
                expect(data.data).toEqual(test_data);
            });
            $httpBackend.flush();
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }]));

        it("should call isLoggedIn method",
        inject(["mfl.auth.services.login", "api.oauth2", "$window",
            function (loginService, oauth2, $window) {
                $window.localStorage.setItem("auth.user", "{}");
                spyOn(oauth2, "getToken").andReturn({});
                var response = loginService.isLoggedIn();
                expect(response).toEqual(true);
            }
        ]));
        it("should call isLoggedIn method: logged in is null",
        inject(["mfl.auth.services.login", "api.oauth2",
            function (loginService, oauth2) {
                spyOn(oauth2, "getToken").andReturn({});
                var response = loginService.isLoggedIn();
                expect(response).toEqual(false);
            }
        ]));
        it("should call isLoggedIn method: getToken is null",
        inject(["mfl.auth.services.login", "api.oauth2", "$window",
            function (loginService, oauth2, $window) {
                $window.localStorage.setItem("auth.user", "{}");
                spyOn(oauth2, "getToken").andReturn(null);
                var response = loginService.isLoggedIn();
                expect(response).toEqual(false);
            }
        ]));
        it("should call isLoggedIn method: getToken and isLoggedIn are null",
        inject(["mfl.auth.services.login", "api.oauth2", "$window",
            function (loginService, oauth2) {
                spyOn(oauth2, "getToken").andReturn(null);
                var response = loginService.isLoggedIn();
                expect(response).toEqual(false);
            }
        ]));
        it("should test getUser method",
        inject(["mfl.auth.services.login", "$window",
            function (loginService, $window) {
                var user = {username: "antony", password : "owaga"};
                $window.localStorage.setItem("auth.user", JSON.stringify(user));
                var result = loginService.getUser();
                expect(result).toEqual(user);
            }
        ]));

        it("should send user details to login Api: successfully",
        inject(["api.oauth2", "mfl.auth.services.login",
            function (oauth2, loginService) {
            var test_data = {
                username: "owagaantony@gmail.com",
                password: "owaga"
            };
            spyOn(oauth2, "fetchToken").andReturn({});

            var response = loginService.login(test_data);

            expect(response).toEqual({});
        }]));

        it("should test logout method",
        inject(["mfl.auth.services.login", "$window", "api.oauth2",
            function (loginService, $window, oauth2) {
                $window.localStorage.setItem("auth.user", "{}");
                spyOn(oauth2, "revokeToken").andReturn({});
                var response = loginService.logout();
                expect(response).toEqual({});
                expect(oauth2.revokeToken).toHaveBeenCalled();
                expect(JSON.parse($window.localStorage.getItem("auth.user"))).toBe(null);
            }
        ]));
    });

    describe("Test auth statecheck service: ", function () {
        var statecheck, rootScope, loginService, state, homestate;

        beforeEach(function () {
            module("mflAdminAppConfig");
            module("mfl.auth.services");
            module("mfl.dashboard.states");
            module("mfl.auth.states");

            inject(["$state", "mfl.auth.services.statecheck",
                "mfl.auth.services.login", "$rootScope", "HOME_PAGE_NAME",
                function (s, sc, ls, rs, hs) {
                    statecheck = sc;
                    loginService = ls;
                    rootScope = rs;
                    state = s;
                    homestate = hs;
                }
            ]);
        });

        afterEach(function () {
            statecheck.stopListening();
        });

        it("should listen to state changes", function () {
            spyOn(rootScope, "$on").andCallThrough();
            statecheck.startListening();
            expect(rootScope.$on).toHaveBeenCalled();
            expect(rootScope.$on.calls[0].args[0]).toEqual("$stateChangeStart");
            expect(angular.isFunction(
                rootScope.$on.calls[0].args[1])).toBe(true);
        });

        it("should allow loggedin users to access states", function () {
            spyOn(loginService, "isLoggedIn").andReturn(true);
            statecheck.startListening();
            expect(state.go("dashboard").$$state.status).toBe(0);
            expect(state.go("dashboard").$$state.value).toBe(undefined);
        });

        it("should redirect loggedin users from login state to home", function () {
            spyOn(loginService, "isLoggedIn").andReturn(true);
            spyOn(state, "go").andCallThrough();

            statecheck.startListening();

            state.go("login");

            var last_call = state.go.calls[state.go.calls.length-1];
            expect(last_call.args[0]).toEqual(homestate);
        });

        it("should allow loggedin users to logout", function () {
            spyOn(loginService, "isLoggedIn").andReturn(true);
            spyOn(state, "go").andCallThrough();

            statecheck.startListening();

            state.go("logout");

            var last_call = state.go.calls[state.go.calls.length-1];
            expect(last_call.args[0]).toEqual("logout");
        });

        it("should allow non-loggedin users to logout", function () {
            spyOn(loginService, "isLoggedIn").andReturn(false);
            spyOn(state, "go").andCallThrough();

            statecheck.startListening();

            state.go("logout");

            var last_call = state.go.calls[state.go.calls.length-1];
            expect(last_call.args[0]).toEqual("logout");
        });

        it("should redirect non-loggedin users to login state", function () {
            spyOn(loginService, "isLoggedIn").andReturn(false);
            spyOn(state, "go").andCallThrough();

            statecheck.startListening();

            state.go("dashboard");

            var last_call = state.go.calls[state.go.calls.length-1];
            expect(last_call.args[0]).toEqual("login");
            expect(last_call.args[1]).toEqual({"next": "dashboard"});
        });

        it("should be able to stop listening", function () {
            spyOn(loginService, "isLoggedIn").andReturn(true);
            spyOn(state, "go").andCallThrough();

            statecheck.startListening();
            statecheck.stopListening();

            state.go("dashboard");

            var last_call = state.go.calls[state.go.calls.length-1];
            expect(last_call.args[0]).toEqual("dashboard");
        });

        it("should fail silently if stop is called repeatedly", function () {
            statecheck.startListening();
            statecheck.stopListening();

            expect(statecheck.stopListening).not.toThrow();
        });
    });
})();
