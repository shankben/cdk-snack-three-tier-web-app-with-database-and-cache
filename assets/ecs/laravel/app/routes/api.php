<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Redis;
Use App\Models\User;

Route::get("user", function (Request $request) {
  return User::all();
});

Route::get("set-user-cache", function (Request $request) {
  return Redis::set($request["key"], $request["value"]);
});

Route::get("user-cache", function (Request $request) {
  return Redis::get($request["key"]);
});

Route::get("user/{id}", function (Request $request) {
  return User::find($request->id);
});

Route::get("new-user", function(Request $request) {
  return User::create([
    "name" => $request["name"],
    "email" => $request["email"],
    "password" => $request["password"],
  ]);
});

?>
