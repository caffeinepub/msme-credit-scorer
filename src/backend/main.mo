import AuthMixin "./authorization/MixinAuthorization";
import BlobMixin "./blob-storage/Mixin";
import AccessControl "./authorization/access-control";
import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

persistent actor Main {

  let accessControlState : AccessControl.AccessControlState = AccessControl.initState();

  include AuthMixin(accessControlState);
  include BlobMixin();

  type BusinessProfile = {
    businessName    : Text;
    gstNumber       : Text;
    businessAge     : Nat;
    industry        : Text;
    location        : Text;
    monthlyRevenue  : Nat;
    monthlyExpenses : Nat;
  };

  type CreditScore = {
    altScore       : Nat;
    riskTier       : Text;
    stabilityScore : Nat;
  };

  type CashflowEntry = {
    month1Revenue    : Nat;
    month1Expense    : Nat;
    month2Revenue    : Nat;
    month2Expense    : Nat;
    month3Revenue    : Nat;
    month3Expense    : Nat;
    predictedSurplus : Int;
    emiRiskPercent   : Nat;
  };

  type DocumentMeta = {
    fileName : Text;
    fileUrl  : Text;
    mimeType : Text;
    fileSize : Nat;
  };

  type FraudFlag = {
    userId    : Principal;
    reason    : Text;
    flaggedAt : Int;
  };

  type UserSummary = {
    userId  : Principal;
    profile : ?BusinessProfile;
    score   : ?CreditScore;
  };

  type DashboardStats = {
    totalUsers   : Nat;
    lowRisk      : Nat;
    mediumRisk   : Nat;
    highRisk     : Nat;
    flaggedUsers : Nat;
  };

  var profiles   : Map.Map<Principal, BusinessProfile>       = Map.empty();
  var scores     : Map.Map<Principal, CreditScore>           = Map.empty();
  var cashflows  : Map.Map<Principal, CashflowEntry>         = Map.empty();
  var docStore   : Map.Map<Principal, List.List<DocumentMeta>> = Map.empty();
  var fraudFlags : List.List<FraudFlag>                      = List.empty();

  func industryBonus(industry : Text) : Nat {
    if (industry == "textile")         { return 80 };
    if (industry == "retail")          { return 70 };
    if (industry == "kirana")          { return 90 };
    if (industry == "manufacturing")   { return 75 };
    if (industry == "food_processing") { return 85 };
    if (industry == "handicrafts")     { return 65 };
    50
  };

  func computeAltScore(p : BusinessProfile) : Nat {
    var score : Nat = 300;
    let revBonus = p.monthlyRevenue / 50000;
    score += if (revBonus > 200) 200 else revBonus;
    let ageBonus = p.businessAge * 15 / 10;
    score += if (ageBonus > 150) 150 else ageBonus;
    if (p.monthlyRevenue > 0) {
      let penalty = p.monthlyExpenses * 100 / p.monthlyRevenue;
      let cap = if (penalty > 100) 100 else penalty;
      if (score > cap) { score -= cap } else { score := 300 };
    };
    score += industryBonus(p.industry);
    if (score > 900) 900 else if (score < 300) 300 else score
  };

  func computeRiskTier(s : Nat) : Text {
    if (s > 750) "Low" else if (s > 600) "Medium" else "High"
  };

  func computeStability(revenue : Nat, expenses : Nat) : Nat {
    if (revenue == 0) return 0;
    let ratio = expenses * 100 / revenue;
    if (ratio >= 100) 0 else 100 - ratio
  };

  public shared ({ caller }) func saveBusinessProfile(
    businessName    : Text,
    gstNumber       : Text,
    businessAge     : Nat,
    industry        : Text,
    location        : Text,
    monthlyRevenue  : Nat,
    monthlyExpenses : Nat,
  ) : async () {
    profiles.add(caller, {
      businessName;
      gstNumber;
      businessAge;
      industry;
      location;
      monthlyRevenue;
      monthlyExpenses;
    });
  };

  public query ({ caller }) func getMyBusinessProfile() : async ?BusinessProfile {
    profiles.get(caller)
  };

  public shared ({ caller }) func calculateAndSaveCreditScore() : async CreditScore {
    switch (profiles.get(caller)) {
      case (null) {
        Runtime.trap("No business profile found. Please save your profile first.");
      };
      case (?p) {
        let altScore       = computeAltScore(p);
        let riskTier       = computeRiskTier(altScore);
        let stabilityScore = computeStability(p.monthlyRevenue, p.monthlyExpenses);
        let cs : CreditScore = { altScore; riskTier; stabilityScore };
        scores.add(caller, cs);
        if (p.monthlyRevenue > 10_000_000) {
          fraudFlags.add({
            userId    = caller;
            reason    = "Revenue unusually high for MSME";
            flaggedAt = Time.now();
          });
        };
        if (p.businessAge < 1 and p.monthlyRevenue > 1_000_000) {
          fraudFlags.add({
            userId    = caller;
            reason    = "High revenue for new business";
            flaggedAt = Time.now();
          });
        };
        cs
      };
    }
  };

  public query ({ caller }) func getMyCreditScore() : async ?CreditScore {
    scores.get(caller)
  };

  public shared ({ caller }) func saveCashflow(
    month1Revenue : Nat,
    month1Expense : Nat,
    month2Revenue : Nat,
    month2Expense : Nat,
    month3Revenue : Nat,
    month3Expense : Nat,
  ) : async CashflowEntry {
    let avgRevenue : Nat = (month1Revenue + month2Revenue + month3Revenue) / 3;
    let avgExpense : Nat = (month1Expense + month2Expense + month3Expense) / 3;
    let predictedSurplus : Int = Int.fromNat(avgRevenue) - Int.fromNat(avgExpense);
    let threshold : Nat = month3Revenue * 7 / 10;
    let emiRiskPercent : Nat = if (avgRevenue < threshold) 35 else 0;
    let entry : CashflowEntry = {
      month1Revenue; month1Expense;
      month2Revenue; month2Expense;
      month3Revenue; month3Expense;
      predictedSurplus;
      emiRiskPercent;
    };
    cashflows.add(caller, entry);
    entry
  };

  public query ({ caller }) func getMyCashflow() : async ?CashflowEntry {
    cashflows.get(caller)
  };

  public shared ({ caller }) func addDocumentMeta(
    fileName : Text,
    fileUrl  : Text,
    mimeType : Text,
    fileSize : Nat,
  ) : async () {
    let doc : DocumentMeta = { fileName; fileUrl; mimeType; fileSize };
    let userDocs = switch (docStore.get(caller)) {
      case (null) { List.empty<DocumentMeta>() };
      case (?d)   { d };
    };
    userDocs.add(doc);
    docStore.add(caller, userDocs);
  };

  public query ({ caller }) func getMyDocuments() : async [DocumentMeta] {
    switch (docStore.get(caller)) {
      case (null) { [] };
      case (?d)   { d.toArray() };
    }
  };

  public query ({ caller }) func getAllUsersWithScores() : async [UserSummary] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    let result = List.empty<UserSummary>();
    for ((uid, _cs) in scores.entries()) {
      result.add({
        userId  = uid;
        profile = profiles.get(uid);
        score   = scores.get(uid);
      });
    };
    result.toArray()
  };

  public query ({ caller }) func getFraudFlags() : async [FraudFlag] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    fraudFlags.toArray()
  };

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    var totalUsers : Nat = 0;
    var lowRisk    : Nat = 0;
    var medRisk    : Nat = 0;
    var hiRisk     : Nat = 0;
    for ((_uid, cs) in scores.entries()) {
      totalUsers += 1;
      if      (cs.riskTier == "Low")    { lowRisk += 1 }
      else if (cs.riskTier == "Medium") { medRisk += 1 }
      else                              { hiRisk  += 1 };
    };
    {
      totalUsers;
      lowRisk;
      mediumRisk   = medRisk;
      highRisk     = hiRisk;
      flaggedUsers = fraudFlags.size();
    }
  };

}
