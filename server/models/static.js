const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
var schema = mongoose.Schema;
var staticKey = new schema(
  {
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCK", "DELETE"],
      default: "ACTIVE",
    },
    type: {
      type: String,
    },
    title: {
      type: String,
    },

    description: {
      type: String,
    },
    email :[]
  },
  {
    timestamps: true,
  }
);

staticKey.plugin(mongoosePaginate);
module.exports = mongoose.model("static", staticKey);

mongoose.model("static", staticKey).find({}, (err, result) => {
  if (err) {
    // console.log("Default static content error", err);
  } else if (result.length != 0) {
    // console.log("Default static content");
  } else {
    var obj1 = {
      type: "aboutUs",
      title: "ABOUT_US",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget.",
    };

    var obj3 = {
      type: "privacyPolicy",
      title: "PRIVACY_POLICY",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget.",
    };
    var obj4 = {
      type: "termsConditions",
      title: "TERMS_CONDITIONS",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget.",
    };
    var obj5= {
      type: "contactUs",
      title: "CONTACT_US",
      email:[],
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget.",
    };
    mongoose
      .model("static", staticKey)
      .create(obj1, obj3,obj5, obj4, (staticErr, staticResult) => {
        if (staticErr) {
          console.log("Static content error.", staticErr);
        } else {
          console.log("Static content created.", staticResult);
        }
      });
  }
});
