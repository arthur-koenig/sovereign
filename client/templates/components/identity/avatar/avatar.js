Template.avatar.rendered = function () {
  Session.set('editor', false);
}

//this turned out to be kinda polymorphic
Template.avatar.helpers({
  url: function () {
    var user;
    if (this.profile == undefined) {
      if (Meteor.user() != undefined) {
        return '/peer/' + Meteor.user().username;
      }
    } else {
      if (!this.username) {
        if (!this._id) {
          if (this.profile._id) {
            user = Meteor.users.findOne({ _id: this.profile._id });
          } else {
            user = Meteor.users.findOne({ _id: this.profile });
          }
        } else {
          user = Meteor.users.findOne({ _id: this._id });
        }
      } else {
        user = Meteor.users.findOne({ username: this.username });
      }
    }
    if (user == undefined) {
      return '#';
    } else {
      return '/peer/' + user.username
    }
  },
  roleStatus: function () {
    return Modules.both.signatureStatus(Session.get('contract').signatures, this.profile);
  },
  roleStyle: function () {
    switch (Modules.both.signatureStatus(Session.get('contract').signatures, this.profile, true)) {
      case SIGNATURE_STATUS_CONFIRMED:
        return 'signature-confirmed';
      case SIGNATURE_STATUS_REJECTED:
        return 'signature-rejected';
    }
  },
  includeRole: function () {
    if (Session.get('contract')) {
      if (Session.get('contract').signatures == undefined) {
        return false;
      }
    }
    return this.includeRole;
  },
  pending: function () {
    if (Session.get('contract') != undefined) {
      if (Session.get('contract').kind == KIND_DELEGATION) {
        if (this.includeRole) {
          if (Modules.both.signatureStatus(Session.get('contract').signatures, this.profile, true) == SIGNATURE_STATUS_PENDING) {
            return 'pending';
          } else {
            return '';
          };
        }
      }
    } else {
      return '';
    }
  },
  elementId: function () {
    return Modules.both.guidGenerator();
  },
  classStyle: function (smallFont) {
    var style = new String();
    if (smallFont) {
      style = 'identity-small';
    } else {
      style = '';
    }

    if (this.disabled == true) {
      style += ' profile-pic-disabled';
    }

    return style;
  },
  profilePicture: function (profile) {
    if (profile == undefined) {
      if (Meteor.user() != undefined) {
        if (Meteor.user().profile.picture == undefined) {
          return Router.path('home') + 'images/noprofile.png';
        } else {
          return Meteor.user().profile.picture;
        }
      }
    } else {
      if (profile.picture != undefined) {
        return profile.picture;
      } else {
        var user = Meteor.users.findOne({ _id: profile });
        if (user == undefined) { user = Modules.both.getAnonymous(); }
        return user.profile.picture;
      }
    }
  },
  pictureSize: function (size, includeName) {
    var style = new String();
    if (size != undefined) {
      style = 'width:' + size + 'px; height:' + size + 'px; '
    }
    if (includeName == false) {
      style += 'float: none';
    }
    return style;
  },
  fullName: function (profile) {
    if (profile == undefined) {
      if (Meteor.user() != undefined) {
        if (Meteor.user().profile.firstName != undefined) {
          return Modules.both.showFullName(Meteor.user().profile.firstName, Meteor.user().profile.lastName, Meteor.user().username);
        } else {
          return Meteor.user().username;
        }
      }
    } else {
      if (profile.firstName != undefined) {
        return Modules.both.showFullName(profile.firstName, profile.lastName, profile.username);
      } else {
        var user = Meteor.users.findOne({ _id: profile });
        if (user == undefined) { user = Modules.both.getAnonymous(); }
        return Modules.both.showFullName(user.profile.firstName, user.profile.lastName, user.username);
      }
    }
  },
  nationality: function (profile) {
    if (profile == undefined) {
      if (Meteor.user() != null) {
        if (Meteor.user().profile.country != undefined) {
          var country = Modules.client.searchJSON(geoJSON.country, Meteor.user().profile.country.name);
          if (country != undefined) {
            return Meteor.user().profile.country.name + ' ' + country[0].emoji;
          }
        } else {
          return TAPi18n.__('digital-citizen');
        }
      }
    } else {
      if (profile.country != undefined) {
        if (profile.country.name != TAPi18n.__('unknown')) {
          return profile.country.name + ' ' + Modules.client.searchJSON(geoJSON.country, profile.country.name)[0].emoji;
        } else {
          return TAPi18n.__('unknown');
        }
      } else {
        var user = Meteor.users.findOne({ _id: profile });
        if (user == undefined) { user = Modules.both.getAnonymous(); }
        if (user != undefined) {
          var country = Modules.client.searchJSON(geoJSON.country, user.profile.country.name);
          if (user.profile.country.name != TAPi18n.__('unknown') && country != undefined) {
            return user.profile.country.name + ' ' + country[0].emoji;
          } else {
            return TAPi18n.__('unknown');
          }
        } else {
          return TAPi18n.__('digital-citizen');
        }
      }
    }
  }
})

Template.avatar.events({
  'change input[type="file"]' ( event, template ) {
    Modules.client.uploadToAmazonS3( { event: event, template: template } );
  },
  'click #toggleEditor': function () {
    var data = Meteor.user().profile;
    data.configured = false;
    Meteor.users.update(Meteor.userId(), { $set: { profile : data }})
  },
  'mouseenter .profile-pic': function (event) {
    if (this.displayPopup != false && this.disabled != true) {
      if (this.profile != null && this.profile != undefined) {
        Modules.client.displayPopup(event.target, true, 'card', this.profile);
      }
    }
  },
  'mouseleave .profile-pic': function (event) {
    if (!Session.get('displayPopup')) {
      Modules.client.cancelPopup();
    }
  }
});