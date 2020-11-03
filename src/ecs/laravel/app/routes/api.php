<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Redis;
Use App\Models\User;

Route::get("user", function (Request $request) {
  return User::all();
  // return $request->user();
});

Route::get("set-user-cache", function (Request $request) {
  return Redis::set($request["key"], $request["value"]);
  // return $request->user();
});

Route::get("user-cache", function (Request $request) {
  return Redis::get($request["key"]);
  // return $request->user();
});

Route::get("user/{id}", function (Request $request) {
  return User::find($request->id);
  // return $request->user();
});

Route::get("new-user", function(Request $request) {
  return User::create([
    "name" => $request["name"],
    "email" => $request["email"],
    "password" => $request["password"],
  ]);
});

Route::get("env", function(Request $request) {
  print("<pre>");
  var_dump(getenv());
  print("</pre>");
});

?>
