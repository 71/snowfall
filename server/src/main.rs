#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate rocket;

use std::path::PathBuf;

use rocket::response::content::Html;


#[get("/<path..>")]
fn app(_: PathBuf) -> Html<&'static str> {
    Html(include_str!("../../client/dist/index.html"))
}

fn main() {
    rocket::ignite()
        .mount("/", routes![app])
        .mount("/static", StaticFiles::from("/static"))
        .mount("/api", routes![])
        .launch();
}
