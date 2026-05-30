/**
 * Portal GDN v2.0
 * Gerbang Digital Nusantara — Sistem Planning & Monitoring Bisnis
 *
 * Build: Kelompok 1 — Fondasi Hirarki & Akses
 *
 * STRUCTURE:
 *   §1  Constants & Configuration
 *   §2  Type Definitions (JSDoc - prep for TypeScript)
 *   §3  Mock Data (replaceable with API later)
 *   §4  Utility Functions
 *   §5  UI Primitives (Pill, Card, Button, etc)
 *   §6  Auth Layer (Login, Session)
 *   §7  Navigation (TopNav)
 *   §8  Owner Pages (Dashboard, Unit Detail)
 *   §9  Admin Pages (Sub Unit Manager, User Manager)
 *   §10 Leader Pages (Workspace)
 *   §11 PIC Pages (Sub Unit Workspace)
 *   §12 App Router / Main
 *
 * NOTE FOR IT TEAM:
 *   This is a single-file prototype. Each section is marked with `§`
 *   and designed for easy extraction into separate files when migrating
 *   to a proper project structure (Vite + TypeScript recommended).
 *
 *   Suggested folder structure for production:
 *     src/
 *       components/{common,owner,leader,pic,shared}/
 *       constants/
 *       hooks/
 *       services/
 *       types/
 *       utils/
 */

import { useState, useMemo, useEffect, createContext, useContext } from "react";
import { login as apiLogin, logout as apiLogout, fetchMe, getStoredUser } from "./api/auth.js";
import { getToken } from "./api/client.js";
import { fetchAllCoreData, indexById, fetchUsers, createUser, updateUser, deleteUser,
  fetchSubUnits, createSubUnit, updateSubUnit, deleteSubUnit,
  fetchSubmissions, createSubmission, approveSubmission, rejectSubmission,
  closeSubmission, updateSubmissionActual } from "./api/data.js";


// ════════════════════════════════════════════════════════════════════════════
// §1  CONSTANTS & CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

const APP_CONFIG = {
  name: "Portal GDN",
  version: "2.0.0-prototype",
  period: "Mei 2026",
};

// GDN brand logo (emblem) embedded as base64 — gapura/api + daun + gelombang + sirkuit
const GDN_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAACMCAIAAAB3WPlaAAAvBElEQVR42uV9d2Ad1bH+zDm7tzdddcmybMvd2NjYgCkGTI8pocR2qIFgCDGYlgB5L3lppJCQ8kihpUGA0Eny8gIhtBAgCZ0EbNy7rC7dfu/unjPz+2OvunRl48L7vae/LOuWPd/OfDPzzZyzEj66H4HIAOc21lb6vNuyeYHAH93FGB/VFyMAM5d7PVc21e2yrH909CgmhI8MC/nRmsPnZzUeHA1UeT054ne70+5/fjTX8xGhAMR8RGXZ6bXlGaWzSl0ysWZiKEDMAv/PAIEAABgwjGunjyMmQNQMIYnXTmtARAT8vwKEQCTmS5rqpoZ8eU0CQCKklV5UFT2tvlIzS8T//UAIBM08MxY6r7EqZeu+NQvEvFIrp9RX+rzEfOChEAfcKcAQeP208Z7BwRIBbOJqr7FyagMDiAPuIOKAOwUsHV8zPx7OKj2EFyViylFL6mJHVZbpA86a4kA6BTGPC/gva6rNOo4Y0foRifia6eOChtFnQf/b8ghEZIAvHjRxZiSQ1zQiEAhgEdf7vYz4emdSHsC0QhxAp+ATaipOqC5LOapEXDAQ0446r7FqRjR0IB3kQADhZtMR07hqar2t9ZgRgZg9CNdMGydRHDD/EAfGHBjg05PrJwQ9BaIxI4JATCt9WEXk4w2VdKDSCnEAUNDMB8UiSxsqByYOfT/MIxRaEjHv6Msn11b5vcSM/2ss4uqp48yRqmwC9kphIg5BAwFsomqPecXkegbA/W8U+xcIiUjMZ46rOiweygxLHIghLI2X2pPvJXMBKYmHpxX6tLryBeUxYhb7GYv9CAQCEHO517Nicm1OqyErYQADMano1jXbfrRuJyEi8BCTYQBkvnraOFPK/Z1W7E8gEBlgxeT6Op/HpqF+TsxBU961sTlh22uS6cd2tEdMUw+GQiDktJ4TDZzbUEXMuD9jqdh/vEDMs6LhM8aVpxxnCEcSQ8iQb3RlntzeLhAR4Ocbmrfmbb8QPOxzckpdMqm22udl2o+sKfYrR66cOs4DQy2eAQSCRfjDtds1k2s7SVv9eN12Uwrm4azJlR552eS6/cqaYv+Zw0m1FQvLwxmlh7CDJo4YxoPbWtemMi6bulz4Ymv3M609EdMY4iASMe3o0+rKD4qF9x9riv3BkcwcNIwVTTUWDUWBAAKG+CCdu29Ti4tXbzbBCPDTdTs7bccUOMyI2ET4zJRx/z9ZhJtHLmusbgr5C5qG508Cxe3rdua1ggGatWv2LfnCzza1BqVBQ1kTs0ovrAgtronvp1xT7HNzIOZqv/eTjdVZRwsUg50Coqb5h11dr3Um5ABz6DMKgfjb7e3/6EmHTElDgykqTSua6nxSEux71tzXQCAywKcm1VV6hcM0MJlkAK+EXQV15/pmRKBh72UAANZMt3+ww2IY4lNuKJ0e9n28oYqH/fV/FhCu9NIUDp5eF087Q8sKJvZJ4+6NO7ssSwAy80h1J0jEdanMQ1vbwyOwpsgrfcGE6pjH3OcFiNjXngGfaqoLSqF5WPrkkS93Jf+7ud0tw0rU4ALxvs27NmQKfok0TLZp8JvLxlcz7GOjEPuQI4l5Zix8fFVsuDkIxILmn67dwWNJTu7fs0rdsX6HKQTQUNbMOHT2+Mqi2P0/liMunljrE0yDS0nFEDHlw9s7NqRzYhhHjmYUL7Ulnm1LhD1yoPkggENU7TWWNVbv2/xK7ENzmF0WPqYqkhlsDszgF7gpa9+/qUXgyNQwimXwneubk4qNIcYlMKv0mfUVVX4v7zuj2JcWcf6Eag8iDVMcTAPv3NCcVs7uN7td1tyezT+4tT1kGophsFFwpdf4RMO+ZAqxr8xhRiS0qCKWUYPMQTOHTePV9vQLLZ2lOXI0B3lkS8v6TMEvYaApCcSssk+vL497PfuKKfaZRSxtrPJLHCKuCISC5rs27mKAPR19YAAEyGp194Zmj5DD2mJY4zPOGFexr4xC7P373bbNcdWxrNJywCVp5ohh/NfOzrXJtERBe96i0MVirOuVznRocFohEfOazqivCBhS7wuj2FsgXN4+c1xFmWEoHpRHegS2W869m1sQgJj25lvu2dhsk5YwKHxYmiYEvMdVx2FfGMVeAYEAmjlkGCfVxHN6UKFJzAHDfHBbe4dl7c0cjMsUaxLpp3YlQqZnUChFIKYz6ytxN0Ly/gXCXfnRVWUNAY89oNBkAJ+UmzKFJ7a1uWXYXl0jMwLcu7mlx1HGAEwFYE7x7Jh/Vizsij0fGRDuCk+tL3cHXwb+v0+IX29pcc2Ex3AuKG3XBCAQm3P5J3d2hoxBVSkB+wWeWlvWl+B/BEC404CNQd/B0UBB9zcpCSAg5fup3J927VbIZIYxLcaNkQ9vbW2xHI8YYBSIec1HVcSChtzLOCr2giBcv4hHh9AksyHh/i0tDhGOBSUiTqj31lV5StuFGyO7LfvJHZ3BAUbh9oHGBbzz4tG9pEyxl35xVEVUMfVNgBFDUMr3E/kX23pcKi3tFMzi59+Ut91oMKMQYxvFk9vbmwuOZ4DYzQACeFFVBPZuRlN8WHMABqgJ+KaEA5amvjvBwFKKh7a1KaLS90dK0AQnH2WesNhadoZ9yEyv1ijFGEbRY9u/39EZMESfUQhEi2huLOKVe+Ud4sMSBALArGgw5hFO79czg1/Kdansi23dCKXYwe1qeUx5283ADhk+/b2bccyLcdf5u53t7ZYye5kCARzN9QHPpJAf9qIe3auocVA0NLCyIGCvkL/d0WVrKh3MhAAivPI8z5wFjs6zyvDi452lHzM1gZQlk27EjoL955aegUyhgf1CzIgE9iZyiL0hiKaQV1ORIBjAK8SOfOGZli4omTsIRCaorjD+42qirBYSEIFt9e3PQShgMJeOpgwAv9/ZkVY8UBlG4KZw4ECHT5cgTCGrfD7VOxNJzH5DPNfWk3ac0rNPKIBYfuUqo2KcQwVABCFA56BppnPDJSZRKdYkBoG4KZ19rTMd7GUKBFDAdX6Pa5UH2jUChggZOIC0IKP4T83dLmWWcAqtee4MY8UFSidI9O4OEBIorT//Gd1Y7yECMbpruX94qqVjIOUQYZnXRIAPncR+eCBMIYzeMEbMASn/lchuSGcQoUShiQAA4rs3SdPvMPW7NCJoB8Ll6lvXSWaJY3nl652pbbmCVwrutVAPCpew8AADQdy/YAYwBP6lrQdKDs26IfPskzwnnWir5FBeNCToFJ13rr1ogamJRwulDCARc0r9rTPlk5KKig0TE8Geyx57D4RD2iaNgMBgICZs/Y/ORAmadENmwGfe+nlgpzhb5w5Q9b2DCVCq73wehSg1GeK63ittCYcYAYEZkSzaq+ruwwNR0JTXJLA4B7Uhk2/OFUqokkIAEay60Jw629ZZFgKYQZgoDEOYJgoABilBpeGIRfaFZ3o0oRzFRdz1rk5md+WLpYdEkbQdF+79DwQOEtEcooSlJCIxmAL/lciWUM1cFOqrzS+s1JQhIYEZ0ICuHvOoZfLsz0pLGyCAAUAAF/Q3rudoSI42pu8W3Vml1qZzXiE0gwDstO3Bjol7hIrYAxS4P29z/7Er70gUAKyZP0hmxywrvn6NGatxtF10EzSgu0f87R169S2y8lg0CgSdg4ap9o0rTCIYLZS6ycu6VEYI98pgV84ZeLECBYyVk+wxEIgIDNOPGBcq8xUVBAAA2JLNI7JbC+/IFkYjKilAazhstufiZY5OkMuRQoCTgynznE+fY1x3iYw0aMcuXraQoFN03WXUNN5TAgsA2Ja1iEEAEPHmTK7vchnALG8oP+YyYAYh9g0QiMjMVRNiC5dOMbwu0RfzpbWprEVgIBQ0pxzHrcFHTgZBfOdGYXgHhUzX3QN+9PsGaRKIwDYG4/a3rpejTci4r+60bJvIECKpeGMm30vVCADoDcUvvD046XAgAiH3GggEADA8xsJPTDEDIhT3FxNaZgBYn8q2W46JQjErHjVkEuHSUz3HLbZVaoRSQmvQeti7DFYJXnqWOvYwr9YwUihlALAUKWavENty+da81VePAIBZPh4CwfILfyI9wd3xEbE75jDnxIaKxpCydbw+1JdiC8SUo1Ynsl4pRhNFEIEIAn7jm9cDO4oBFQENFbRHYERm97Y63/kcSClGi0RSCAAwBb7Vne6bpHHf6h0/j2w2Jy6IL7kJmADFhwcCEZg4Vh2aubjByjuCobIh3Be93It/pSMJgCaCT4ygG0oBzHDpucaU2Y7OgOlnM2LIwFhbfhmEiQAmWvLwo+2zT/IS4TBTQgCImIYpRJ70y23JfoZiAgDvxAUMSNlk5JTrvLUzgMbAQozpGHNOavT4JRMoRfGGoNfvYWbAYvbyakeiuWBFTBk2zT4y7zd7Aq9HrjqfOE8iAO+t9iy/wnj6OQ/6kWi0hBXJxM3bPPPOFiu/YrCE6y4mRDmkMeJ+TcwjQ4ZcmyysSaaLcjkiMBmBmGf8XHYsYAJ/JH7azQhceiOlKBnwOFoVaJxTbueVkKg0Bct8lY0R6B0REohJ236hNVFmemr93iEG4ZrD0fONaTOVnWERFL9/3nj06cJ9vwXwiAFADJKVtM0yjn95Xb633nlvA2Iaj1hAc2cIGon+a/werxRPtXTrPlJFAYC+iYfLeAM4BZAG5bKBeWd7q6cy6xJGIUpJqwCNB1f6ApKp2LsUEhsOKh/ywid3tOe0nlyUAwaRPwCcfDSwh1AAp2nl+c5BU3yrLmJQJETfa/tvlVLoqcZXnjNvu4cev8P7u7u04ygRpFOOljC4c+G+dWYkuCNrPdvS2Zfau4l7cO7pLGVxmJscDEVC88+GkolnydIfoK6pjHqngBDRsdW4mXHTZzIVvUMgbsvmn2lJHF4edrX8wR8gDpkB6Ir9CuIVuq6GayoIdD9B9sn5pMGM4Wt/9y27Gu74Jpy7rFAecVADMB06m/tiNvTO7hko5sRCj25rSzuqqIAgMmnDHw3MWUKWDegWLEiafdMX99HHngHBDIZpBCu8DvU2bxC0o8OV/vGzKgaqgwhwz6btNX5vuddbZHsXCAIArCxDUAAIgMAKlAOOU2x/FMtGBEQGAsMP69aZ56/i+27DxSdYVjOTBhAAmuuqFEA/rbhfPSMa0owPbW/tb6ahAIDQnNNk9SR28r2XjayUrJggTD/0Zhm7C4T7CZ6g6fGbrAeGN0FEU4+s7dtUQMyIuCmdf6kjeVxNbHgcZeTBwbg3fQRwvaOIMYMMwvN/5SPm80ln24U29nh6DZlBDK6+3F9OqC17aHtrylbYJ4gxI2D4mBU0aNAVgZQMxIxgvIR3lIoapimkMUh0QwGOpaonR2omx5nB3Tfgzu/8auPOiaGAwP5aWAgA4M4EgOz1aQYAdDSAAcymIgMMZOpdB4NpsscgynF/sGQAKbp7xMAluPMnXikf39bWP5QlJDAFpy/2TV/EhUx/NokATGj60Rv4EFED3RuIw4/5YAABc04c797GvmSuvWC/1pmeGglz7xW7KL27RrBRnK1WGroSHA6CZctFF+Ki81HnpRA00B/14OKCAUDCOx8AQFEZdy3uoLLIH5s7rIE5KTMClC25kVAOVuwQmBmRUX4IIBgAmIkHOn3RKNDJq7oZZQ2zKrh3M4lbL/+9vVsKIbG4bGYA4KdeYrSLEqRRByccKT/3bcPjeDdu4zffp+YNZiyCSg+Ef1jsssQzL2NfIkfMHikTjn6/J93PDkICU/jg030Hnaxz6cHFhVs1M5ac0SjlGkox6ZFzQCY177RGw+if3WAGxbQulemzYE2ACK+85bz7rilCkLPNm2/yzJkqpBTnrOIPXvb8+KvGRTfSuq0y4CvKvUOm5DSBCMI7/zRefVshgqb+PvO6ZLo/ViMCgDB9ZWd9TRONmOuzstnJ7wEQRQXNFeMK2iloMcw7ENG2qLIxPOPYcTx4h5HSWg9IlYQAR+lv3oUYkes3Gd+9x7n03wqP/Aw9pr70anX1TXzhufTkn/OREIIGBvD70LYH30tDfvtuUFoN9BelNQ34FkQBpOMnXmNOOoQKmaFZEwMISYWMzqf7U5BhmZUYSQUrrtyxHDvvoBihSSEEWnl18CnjY9UhplGPe9AahIAnnrFf/IPn4EPsn33LXHyYufJG/chv0eOBM5bg5atw6cc83UlggSjkH140DposgBgBtAYjis8963n8T7YQI1Sova4qmbSvdmbk9H/TuSyOUHEzSoOz3WRl+m8yEw5euxgSlMrHRU2PLIY64ky3LSSO2C1gzaZPHrl0ihBijOYU65VfVYWMXHFp4dmH9Or1eOUl+Pjj2NwOLzzBs6dCLg9YBb+617N1B954DVECEAFNyPSYV31NcynfRgYQwqi86Mfgj4JWI6QJzCCk6trKpNyILTyB0Pi5DIOGW8RAFLwB86hlRfXFtZ2elrQQI7etUKCVV3XTY7NPaGQadQseEUgJa7c413zFBFuyZb/4pHrrPfHIL3DxQsjm2bEpEuKe9Z4v3w6//qE2pWICYpQhc9WX5fqtjpQwWoUGQgLp+JKbvLOOp2xyRAGGgYUEe+dqAECUACB84cqLfjokrRADxbgZi+qrpkZ8YU8fNh1b06xhtLpNCMznnblLGmsmx0tgoTUYEn7xROFn93mMkBAetfRjtGmrVooRARClND9zPd60gqcfbDtpIAKzHO+627z3d5YhSzkFkApNPTb28S/rbBpHbR8L0FTY/Hp/AyVSZU4/smzxlcCMvWQh+grNYMw3bVE9a6wYH+4jlY5t6XzSkkaJYRZkoEUXTPOHvUw8WldeE0jJV3/defFFH0SgJ8kBP7pEEI/hLXdSOIKrPqtUBwOwWYYvPOtd9U1bStKjdc1QMJEnWlt52S+I3Xx+REmP0fBQorWwpR8I34QFxBw+/ipP2Tju1WxEb8kNBx0/PhD1aKVrm2LuJyBiIWO1bk4ZHsE0attG2xSq8C26YEaJs5OYgZls5Sy/TnVs8pVF2NEIwAIhlwPbUbd/TVNOMaEZhg1rfcuvVUqrUcerEBGFQFH96Z+Lqia28qOqkkzo9RU2vuqk2wGlSze+6ceyA1hWFzvlhj4VT7ikGC4PTD682ikorXXVpKjpNbk3IG95u6N0PxEFWlmnYXbZgjObxiALAR099idX0M4Oj2mwqzDnCnD9pUaoxnZyYPi5p8d39meos8eRYnRqQMmkKj/xbe+8JTqTAGmUGCKQwNnXHgYAFAJIG76Ib/LRpCydz4QWXeqtnOSKV8WGyMxjG3xBg4hJcbjSVzM51keiOz/o7GnJGh5ZotMsJBYyzuyTGqYurCtFFgSI8MLr9h0PFqrK0d3Yiwh+k9gGNIDQXH4VrN5kGbI/fRoGggmk4kdfGjntRpVK4ugoABN6A87O1Zn3/lRspQAGph1jVk1gxwKtMBSLnbjKTT0FE/sj3qb5VXZf7oTQtKC6GHcQla3XvtxieGTpYWpEtPPqiGWT6yaXlcCCGUwDtFbvrBa2XdyKoTQwsCdiXP0l89m/WYYBSo8GucHaCU07Ln7xHTqfwZIyJDMZHjP1wp3azgEKZgLg4MILSEgEQCkpnw8uPN+I1gFpAQBN86v9MYM0FUsJS42bVRapDDIX06sNr7V07cyaXlmqyYrFju4xl86MVgVLZFmOYgD4yQP243+meIyVBq1BxOXtd3vvetgyDFaqVJjwVU+tvvJBzchEJUcSSXiDzvb3kn+7rxcv9lVPDcz5GOWzICQAsrJErCqy8JMAIIQUE+ZVadX/oaTZEzBnHFPXd6uVrd75wxbDFSFLqt7aIV/IOP7SWb6Ah7nUaJejVXeioJSBANEorX/V+/lbLSn0aMESUDBpI1hWs/IRjtSAk4cxzIHRMLuf/A9tZYuvZI4evxKDUdZOX25OSocWnIvSIysbowed0EADRgQRUWuK14e3/7OzkLERAAUm2rLh8mD1pKhjqRLHFyCitilU4Y3Xhbe80w6jCkJF2LfsNEzTDAbld+5ytrc4iKOGCQAUwqi76lFz6iLKlqQGANZKhmP5V3/d9dSt4Hacmb3VUysu+glpjYi9RwciaCVjNdaa5+S0I+vqpsW0QwPvHhN7A4Yv5Nn6bjsKdwAB2jYlJ8yu8oVNUlTiVqNAx9LlDSF/0Lf9/Q4hxMh9QAYA2NqsN26n99bi6k3WqCgAgDCAdfVFdwaO/CSle1CaJUdYtPAFuX1T653LtVtxokCmqot+Yk5cwFYOBggTTFr4wtCzQx58UmMo7qXBuRAiKluXN4Z7duYSbVkUCIDK1p3b01MOrQEBJW51Hxa1U2LagdZNPWLYpveBd9qyKZXVpVCQBpCq+NjN0TNvVunEGCgwgTQE6/Yfn1NoWw8oABFIR+adFTvnFp1LD6nKsPfz5dxTJ0ivHK2zUdNUtumtdmUpQECB2Z5CpsueNL9aKS49ruRC2TCrPNVa6G7J4OgH2rpT2KMiJQwgFT10Wfmn7lL5NJY+mYqZAU1/sPPnn069/3RxzcxmpLpm1RNs+JH1CPyKIIQh5y6ZOCLpIILWHIiakcrQlrfbUaAbFLt3pZ2cmjC3Sjl6DCwAmahxdmXLukQ2UcA9P9zXLbEDEw+rvupxJg1UqkMDzAxshiJdD17X89efozCK2TFT7RUPmk2HcyE7QgKK6Kbhcs4p40dLjBFRW1Q1PoQod63vFrKIRfvWpLaocU6FcqhU0wSBiaWJ9TPKt77T6RTUns31oEAmT7Su9ob/5mAFOIVS3X0mADSDkZ5Hbup65ocgDCCN0mRSlWffEjr+Cp1OlOBXFELOOm6cNEr1u5Stx82I5xJO5/ZULxaibXPCyerGOVWsNdCoTXdEJMX+qKe8Prz57fY9QQERBQqjbuWjxsRDKZ9CMXqYIGJpmL5g929u6HrmB1hEwWDtxBddVvbJ7+lsCkuAiAKtjJy8oM4fNphGNXIG1Joa51QmWgs9LZmBdpHpssfPrhACSI9adyKisig+LmQaxs4PunbTQVAYTLpq2W2BRReWDhNMCk2fFNj5yxU9L92NwmBSKE3WTnTBueUrfkVWvlSzjxkNj+raKqsnxeLjQlrT6CsBZmbmiXOrky35ntaM6OWLrp2pzm2ZcbPKvQFD2TRafoEClaVrp8USbfmeXZmxsRASSMcOW1523vdVplTKwFrJQASyXR0/XZp6+7cgDCQtXBQOOafyMw+S0sClmYXQEyh88LwMRHz1B8XJKZkaFPd088R51ZnOQveuTB93pjpzO1Z3V0+MRaq9qkCjV+LITOOml2/7V6eVdUptJkABTN6qKdWrniBG5FHyaGZmLSMxteWt1ts/ntvyOgoTSKOQTCp2+PmVn7lPawJSY4yIMAvTm/nLXdKxqGl+jTTG9lkXiwmHVNt57tiaQLdAE1jI2JvfbgtH/VWTolrpETNrRGDNnoAsr41serMNRp3HRBBCCKN25SOybiZYuZEJkgiEMEKR/CsPtNy53Ek0u30NQAGsy09cVX7J3dpxxogyrqwkDLDSiSe/LK2sUz8tHq32azXG2cMuFqy58eByw2M2r+1xYyQiakVb/9Xh5HT99HJhIDkjuAkiKkfH64OOhW2bekZ2EGEA6fJTPx864XKdHtkpWCvhCwjExCM3tj92MysLUCAgMCFw1dLvxj7xDVXI4m6MCwGT8AWdDa92P3u7BABpyMa5lY6txtz+4lq+tnXD9LKy2vCudd3K0e6aEaF9a7J9c7Jmcixc5lGWhpGxoJrJsZ3vd+fT1tCvQwGsA+NmV15+n3ac/opgkB6uZTjG7Rvb7/hk8vVHAAVg8Y1GIF57xQPhxStUJomAY6MAwEzS50/+4db89rclAGS6ChPnVnsCskTsGLIix9IVjcFx0yvat6TzKQsFMiAKTHflN7/THioLVk6IKEXDVUwmNn1GtNI/goMgImLt5fdh7QywC0NXQppRGOFI4fXHWn76iULLGpSGO7wNpAMNB9de+1vPzMUqk0Bh7NacKTOaPura2fnQdeRYEgUqRwspxs+ucCy9WwfjIaBAx6ZAmadpfk0+YXc3p4tuIlBZesu7bU6e6qeVCVPowW7iGkW8PpTuKHQ1p/sdREhgih1xQWTJjcPDPmslfCGBnHz0C+0P36DtXF9NCUyxhRdUrXxYlI2nbArl7j4fgkmboVDi97dk176Iwij2crp2pcfPrAjEPKRpN/eHISI5JEyYdEiV1+fZtbHHvf8IgIhtWxJtm1K1TbFgmXeI07lTmuXjwpvfbleWBnSDPBv+WPUV95M3jDSoImBSMhyjtg3tdyxz3cFNtpi1MLxVy26LL79NM7NdgN1GAUgLf0hvf6/9/pVMGoDcXg6SolRbYfLh1bsPRJEyCJRDddPLapvK2remCxkbBTKwECLdnd/8VnukIlDZGNG27g8miFpRuNzfsyvX7RoFCmAqO/l6/xHLKD+gQGQCYCMczb/xROtPzy20fABCArAr0vhqptde9XjgiOU6mwSG3Rw17tMApGm233Ox1boOBAKzLCaPAtNdOSHEhFlxJ6/2YMc5AiI4BR2t9k86pDrbY/XsyvTnUbbe8k47a6ibHne7hG4nSRjCSjlv/nGLU1CIApjNUGXVpb8A6emfkiUNpld6vMknvtz+4Cpt57DoDgBMscOWV618VNTO0LtPCv2Opo1INPX7b/S88ks3H4f+A8IZUGDrhkSsOlw5IWzvJlkMyB21Q9IjJs2v8gW8LRt6qOgmiAitGxPdzdmGmXGPz3DrNI/f2PCP1i1vt6FAAAlM8ROv9R92NuWLky6slfCHRT7ZcfcFPX/9uSsrICIwScNbtfwHZctvI5RgZXefFHpRcIxIWf61J9oeuBpFf8tgaLqyc01X5YRYWV3A2VMsEJlAO1Q3LVYzOd6+OVV0EwYUmGzL7lzTUzslHir3Klsz4+uPb8ilbLerYvgiFRffxWZxaJq1I0JltGtNy3+ekd3wCggDmEAIIO2tnlp39eP+hctUNom8W9PmQ1EIl9lrXmi98zzStnu20QhAIIJWtP29jsoJ0XhdyCmoPcQCENGxVKTKP2ledaazkGjNIiIDo8B82t76bme8PlQzMbZrbc97z29HLLJD5NCloeNWUCGLQoB2jEiZ9f6zu370cbtrK0oDXDWFKTLvrNqrH8e6WTqTQGns6W4d1sqIlNlrXtz1k3NVIeW6ZL8MNqISve2dzlhVqGJCyLH1nm4zRkTtkPRi0/xqJNGyyU1Ai2r4lrc7yuoizWu727cmUCAzI2Dl8ttkxURQNhMZkbL8337Tcud5upBCIZkZmRG48sz/qLj4DpIetjJ76g7AzExmNFZ444mWO5arQsq9AYP0wJFXomnLu+2madRNjQMxjd7dHd1NWGsaPzserQg2f9CtNSO6chFvebu9uyVDitx74qudWXb210kpJm1EY9kX7mn5xaVMCl25kUl6gjUr7g2fco3OZYD0nroDkAbDNAKh9FPfb733ClLWcBRGBcIdBNi5tjvTYdVPj5sBWaLKHlVYQbQLumpipLqprHlNd7EPwMDMpMjt3gFT9JjL/POWUC5lROOZF+5uve/KouKKCKQ90dq6a3/nnXe6TiXQ3T29R5agtQjE0Ep133dl55++17e0ERTiob8LSUyuBo8Cu5rTO97vKqsNxeuC2iHeU9MQ6Fg6WhUcP7O8eW3CytqDay1GwPg5t4hInQiE868+0PrLywAFACNKIO2tnlJ3w1PGhAV6TAl/pMQRhfSEIvbav7T+dGlmzfNuMiqEW0YPLWTkwKkPZlh4+PxxtbU7mncJKdyYmk/bm95o0w7XNEUNn1TOnrGGm00EYt7G2ZXNa3sKaRv7xuiZvZWTyk77IgbD1vvPttx1nlvpo5sv1c6ov+EprJpM2eSeoeBKFYEYKiv5u6+23Xelk2oHIZFJCCSiuQfP9njNZDI1cBlyiMafzxdu+/Z/OLaz5oP14O6VA2Dmtk2J5g96YpWBsvogE5fQ5kbOMmwKhOT4WZW71vXkM7ZblgBz+KCTQ4sv1ttXt/zoTCqkABFAAGtv9ZT6zz2F8UbOp/eIGpkUGl4jGHJWP9d29wXJNx9nZkAhenW2Zeee+cmlH3/8yf/WWvNoUUMIkcvlpkyZuOrKSyPh8D/fW21ZtpTCXUwuaW18va2QcqoaI/6IR9saeHd3nKJAZVMg7gtGfZvfbusLnNHjrvQ1HdLyvdOt9o0oDAQA1ma0pv6Gp7FyMufTe1Q+AIAMRTnd3vPIze2/udZJtqAwEFgKJKJQOPi5VZ+59qpPP/zY7998+59SylJAAEDQH1h46Lzp05qOPvrwHTt27Wxu6TMNRO7YntrybqfP56kcH5EGOIpH5Z/hsouJzWt6XAnXHcGpWPad5J/vSL3xCEqTSaNAafjrVj1pTjyUssndRYGZSQt/WBpG/uV72+65KPvB84AI6BICM/Oh8+d966tfOPLwealk+pe/fqStvRMHnykph+u0APixU4/P5/Ll8dgpJx0XjYTfW7POtmzhDhILtPPOtvc62rdmYjWhaHVAE/PueAqD6ZXrXm3p2pl2ydhT3hicsKDt4evcAOHmjtUX/Mi38BN7wI6kwDCNUNjZ8mbHr1Z0/fk/dT7lGpdAIKJQKPjZKz51/dWXR8PBfMFKZbL33v+YZVlDPsYY3pht7+xIpVLRSCSfLwghzl/28cMPPeTOn93/11f+XgwrSIDQvK6zdWP3zGPHzz5xnC9iWFkFWBINBOVwutPdJ4sAYIYre56+jbUCFC4KsYXnh064UqV2jx2ZmFkGY5xu7/ndl3ue+zEpG4UBTAJJEzHDsUcvvPLyi5smNqRSGSIKBPxbt21PpdMwbIuqHJpBAADD6R87KRIJuXlUPl8oL4udfMIxjQ316zdsSabSRU9BIOL2LYnt/+z0h7wVDWFE1iUbHKxh9Ys7razthg3KdNld23o3cbM33lB91WOE5qjK9eB8GT1+wxssvP5I290Xpv/5RzdeIrA7S19fW/P56z97xWXnhwL+TCbner3P6924edszz700/CKN4b16IqIBwyhSyoJtg2WdcuKxh86f98BDTzz62z84jhLu/BVCsjP34r3vb3236pAzJkarA1bOGSG+MqBEO6OsrA3Fcw9QK6tvEykwlZ99C8ZqyS2rS/e7AWQ4plvWdzzx78k3n3BVX2RCYCIyDGPZOWdceN458Xg0ncoAopT9eze0pl4SKAGE2xF186/BJ4oCYjKV9vm81159+fGLj777Fw+8/uY7ACCFcDfLbHm3fdeGxCGnTZp2VC2TdiwauO2GAaRAK6/sguqd4ezdrSIkkA5NPjJwxHkqmy6NAmslfEGJkH7+p51PfkVlu1xpU/b6wqHz51654uLZs6Zms9lUMi2HTaGKUfSbEb5VSmmYI4xLSSm11olEYtqUST+89St/eu6ln9/7m5bWtuKnI1hZ+++Prt25unPh2ZPDNf5iIwf7OgioLD1834M7OxFbchMLEzkPo20vYQbWMhyjlvVtD12X+tfTrtIp3PxJc1VlxYpLzltyyvEImEgkhRDDUWBmj2nASEfRjACEx2t6POaIYy6IIKXI5/MAcMapxx9x+Lz7H/rtY0/+QSklhHCnV3es7uzYmjrsnKlTDquyCw65E3YMgODYukiU/cfuCSYKNM73HnSKzmdGbdWSBmlIfzj3yq87Hv6ck+l0xV6J7Jr6WWeeetnFy6srK1LpDDPLkceRkYgCgQCMdE77CEAE/H6f10ujz6y51pVIpfw+3/VXX3bi4qPu/vn9r7/1z+KfBBSy9l/vf799U/2hZzUZXuFYGoszusWtmYMPNYbw0Z8Cjw/sAqAxYtUgfCG0s12/urLnpbvduQk3D9GaJk1qXPXZS486bEEun0skU1LKEk1cIgqFAl6vaVn2kDzCGN7LikYjPp/PcRwc47A511OS06dO+sF3vvLHp1+455cPdvX09JnG2r81d+7MHHvh9GitP5923PY9DEQCEUhLXyQwZwlbFo7kFKyVDMVo15qWn12S3/oGCglMAlgzI+AFy8+55KKl4WAgkRzZF4a1Csnv9/v9fsuyh97d4a+ORSOmOyC8G7W2lDKXK+QL1tkfP+UXd37vpMWLiIiJ3R5H5/bkUz96p3l1wh82mbh3oBv7W1sA/slHiMqJrArDDZBJy0jM/tfTO289Nr/1DVezQ0RNNL6h/vbvf/26qy+TQqTS2RKGMKj/QBzwe8PB4AhmPjyPKItFh+ThYyTOQgjERCJVVha55Ss3funma8KhEBEJQBSYz9jP3vOvdS+3+kKe4mZeHrQV2j/jeJBipIeZaSMczb5wT/PtZzrpThBSsGZmIjrl5MV3/+TWQw+Z3dOTICIpd1fIJyKfz1deHodhEX4En6yuqvgQZwBKKR1HWZZz5mknz5wx9Ru33r5m7QYpJSER06uPriXisvrQELtHAN/EQ1kN7jUyA7ARiib/61vtT3yxWDUAE7NpGtd8dsWyc5bk84V0OjemLwyPGoZhxmPR4ZMjI2BZUV7+4Q61QkQpRU8iMb6+7ic/+MbJJx6rtRbC7X3B3x9ft/rZHVL2BmZEZpbBuFHVxMoe1NoClsFIzxNfbn/ii24ckYhEVFVRcft3v/7Jpacn02ml9e4bwkAghMCKihHOyBVD59IAKuJlRPShD4Y0pJErFBDg61+84bxPnKW1q3cBAGxb0671wK3uYMTHi1AFaNUPBGkjFEk++ZXOP9yCwmAiKYQmPW3KpDtu//Yh82Z19ySkkHvxHAWurqkcgyPcPYTlFfHRJ6J3z02EUESZbPaGa644f/nZWpNrw4jYf6AAIgAYsRo0/b2HqwGTFpFo+qkfdPzX10EYTFpKobWef8icH33/lpqq8mQqY+yphD3YaJm5LBYdXnSJIUzp9frC4ZAmvZePrnAdIpFMXrvy06efcoLWWg6eRXaZ0ozUgCyGU9ZKhqP5vz3c/sjn3LxbStRaLzx8/ve++SWf15vLFwy5V8/uRQCtKR4vKwWE+xMM+EMBv9Z7dcL7ACEbspnsTTd89qBZMzTR8Dwfg3H3WFAmEsGI3vh6268uZ0RglhK1psMWzP32176AgLZtfwhSGLFTURaNymET4gMtAgAgHA75/b694YihX0wkhPj3G68OBgNuRTfoBR6fe/gCGiZmOlvvuUhbGQAUCFrTrBlTv/W1LyCAoxwh9s2DH4go4Pd7fd4hEVQMEW8DQb9hmsz77OnMQohsLjelacKnL1pOw4Dok0Ck19f5wLWFtvVuHUVEdTXV3/7av3tMr+PsMxQAgIl8Po/X6x0js/R5TCn28YN5DMNIpVLnnrVk8sRGGuIgWjGBDMVzL9+bev1hV1YABJ/P97Uv31hZESsU8mJfXg8Ss8f0+MYEwpBGr3K5L3+0Jr/fe8F55w79g5VBk6ljc8djX2AUwCQQifi6q1YcPHt6Kp3de14YUncBs5TCMOTYtcb++JFSZjK5RUcfNr6hjopnhzMA6HSXNLH7yS856XZAIRE00UnHH3POmacmepLDL3dfgDGKCw/53XEcZtofD1HUWkdD4VNOPA4AsPewXK2dwnuvpV57BFwQmKsqK6696rJcPifEvr9JzIyISmnbdsYAIpvLO85+AUIIUbCsRUcfbpqG1tptgVLX9u7HvsBA6O7vYF55xacqK+K27eynJ1oKFPl8IZvLjwqEywsdXV3pTFoKuc9pAhELljVxfP20yZP6LDS39c3Mur+Au7eD6LAFc08+cVEqlZZS7j8n7Ukmc7nckJxKDDGbZDK9q6XV9Bj7HAg3dHm9vvmHHNwXN7n3nEJmloa87NLzmXj/URURm6axdet2GpbdDf5FIDO//c77HtOzP64HEbXWs2dN71er3CRCCmZefOyR8w6akc3uF3YY0FYQr7/5z+F6xJCiiwHgT8++lM7kTMPYH95h207j+HqfzzuQkolYSnneJ86yHWf/PeyWiH0+787mlpf//kZfhTlqGS6E2L6z+YGHHo+EQ/sDCKVURXl8XH1d3z1xzeGoIw6dNWNKLl/Yf+aAiB6v965fPJDNZkWJWqMXCxJC3PfgY08986Lf7yeifXs1WlMg4JvcNKGvunGncM5YciLsX3Ygn89734OPP/v8S0KI4ev6fyxQtSeUc7J1AAAAAElFTkSuQmCC";

const ROLES = {
  OWNER: "owner",
  FINANCE: "finance",
  HR: "hr",
  LEADER: "leader",
  PIC: "pic",
};

const ROLE_LABELS = {
  [ROLES.OWNER]: "Owner",
  [ROLES.FINANCE]: "Finance",
  [ROLES.HR]: "HR",
  [ROLES.LEADER]: "Leader Unit",
  [ROLES.PIC]: "PIC Sub Unit",
};

const COLORS = {
  // GDN brand palette
  // Primary accent = biru-air (elemen "aliran air" / perikanan)
  primary: "#3B7BC4",
  primaryDark: "#2C5F9E",
  // Secondary = krem/emas (brand GDN) — dipakai untuk sentuhan brand
  secondary: "#C9A45C",

  success: "#5B9B47",
  successBg: "#EAF3E5",
  warning: "#C98A2E",
  warningBg: "#FAF1E0",
  danger: "#C0453B",
  dangerBg: "#F8E7E5",
  info: "#3B7BC4",
  infoBg: "#E7F0F8",

  // Charcoal (header/nav) — dari website GDN
  dark: "#1E1E24",
  darker: "#16161A",
  text: "#2E2E36",
  textMuted: "#6B6B76",
  textLight: "#9C9CA6",
  border: "#E4E4E7",
  bg: "#FAFAF8",
  bgMuted: "#F2F2EF",
  white: "#FFFFFF",

  // Brand gold accent for nav/logo
  gold: "#C9A45C",
  goldLight: "#E8DCC0",
};

// Brand typography
const FONTS = {
  body: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  heading: "'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif",
};

const STATUS_THRESHOLDS = {
  onTrack: 90,
  attention: 70,
};


// ════════════════════════════════════════════════════════════════════════════
// §2  TYPE DEFINITIONS (JSDoc)
// ════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} role
 * @property {string} avatar
 * @property {string|null} unitId
 * @property {string|null} subUnitId
 */

/**
 * @typedef {Object} Unit
 * @property {string} id
 * @property {string} name
 * @property {string|null} leaderId
 * @property {string} color
 * @property {string} colorDark
 * @property {string} colorLight
 * @property {string} icon
 */

/**
 * @typedef {Object} SubUnit
 * @property {string} id
 * @property {string} unitId
 * @property {string} name
 * @property {string|null} picId
 * @property {string} icon
 * @property {string} status
 * @property {string} createdAt
 */

/**
 * @typedef {Object} KPISnapshot
 * @property {string} id
 * @property {string} subUnitId
 * @property {number} score          - 0-100
 * @property {number} weight         - 0-100, weight within parent unit
 * @property {string} period         - "Mei 2026" | "Siklus Mei-Agu 2026"
 * @property {string} closedAt       - ISO date when closing occurred (determines which dashboard period)
 */

/**
 * Margin entry from a KPI submission.
 * Aggregation rule: entry is counted in the period defined by closedAt (not period start).
 *
 * @typedef {Object} MarginEntry
 * @property {string} id
 * @property {string} subUnitId
 * @property {string} unitId
 * @property {"monthly"|"cycle"|"event"} kpiType
 * @property {"estimated"|"approved"|"closed"} status
 * @property {number} targetMargin
 * @property {number} actualMargin
 * @property {string} period               - Human-readable period label
 * @property {string|null} closedAt        - ISO date of actual closing (null if not closed yet)
 * @property {string} expectedCloseAt      - ISO date when closing was expected (used for pending bucket)
 */

/**
 * Project entity. Each project belongs to a unit (optionally a sub-unit).
 *
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} unitId
 * @property {string|null} subUnitId
 * @property {string} name
 * @property {string} desc
 * @property {"on_track"|"at_risk"|"behind"|"done"} status
 * @property {number} milestonesTotal
 * @property {number} milestonesDone
 * @property {number} budgetPlanned    - Rupiah
 * @property {number} budgetSpent      - Rupiah
 * @property {string} startDate        - ISO
 * @property {string} endDate          - ISO
 */

/**
 * Form template — Bapak rancang sekali, dipakai untuk banyak sub-unit.
 * Each field can be manual input (number/text/date) or auto-calculated from a formula.
 *
 * @typedef {Object} FormField
 * @property {string} id
 * @property {string} name              - "Jumlah Tebar", "SR", "FCR"
 * @property {"number"|"text"|"date"|"auto"} type
 * @property {string} satuan            - "ekor", "kg", "%", "x", "Rp", ""
 * @property {string} source            - "Manual", "Apl Pakan", "Pembukuan", "Formula"
 * @property {string|null} formulaId    - ID from FORMULA_LIBRARY if type=auto
 * @property {number} defaultWeight     - 0-100, default weight suggestion (Owner can adjust)
 * @property {boolean} isMargin         - Mark this as the margin variable for aggregation
 *
 * @typedef {Object} FormTemplate
 * @property {string} id
 * @property {string} name              - "Kolam Deder", "Cabang Pulsa Bulanan"
 * @property {string} description
 * @property {"monthly"|"cycle"|"event"} frequency
 * @property {FormField[]} fields
 * @property {string} createdAt
 */

/**
 * KPI Submission — instance pemakaian template oleh PIC/Leader.
 *
 * Lifecycle:
 *   1. PIC/Leader fills estimation → status: "estimated"
 *   2. Owner reviews & sets weights → status: "approved"
 *   3. PIC/Leader fills closing (cycle/event) or updates (monthly) → status: "closed"
 *   4. Bisa revisi → new version created, old kept in history
 *
 * @typedef {Object} KPISubmission
 * @property {string} id
 * @property {string} templateId
 * @property {string} subUnitId
 * @property {string} unitId
 * @property {"estimated"|"approved"|"closed"} status
 * @property {string} period            - "Mei 2026" | "Siklus Mei-Agu 2026"
 * @property {Object} estimatedValues   - { fieldId: number/string }
 * @property {Object|null} actualValues
 * @property {Object} fieldWeights      - { fieldId: weight 0-100 }, set by Owner
 * @property {number} subUnitWeight     - 0-100, weight of sub-unit in unit, set by Owner
 * @property {string} createdBy         - user ID
 * @property {string} createdAt
 * @property {string|null} approvedBy
 * @property {string|null} approvedAt
 * @property {string|null} closedAt
 * @property {string|null} closingNote  - mandatory note when closing
 */


// ════════════════════════════════════════════════════════════════════════════
// §3  MOCK DATA
// ════════════════════════════════════════════════════════════════════════════

/** @type {Record<string, User>} */
// `let` (bukan const) supaya bisa diganti dari data API saat bootstrap.
// Semua pembacaan `USERS[id]` tetap melihat binding terbaru.
let USERS = {
  budhi:    { id: "budhi",    name: "Budhi",    email: "budhi@email.com",    role: ROLES.OWNER,   avatar: "", unitId: null, subUnitId: null },
  rarra:    { id: "rarra",    name: "Rarra",    email: "rarra@email.com",    role: ROLES.OWNER,   avatar: "", unitId: null, subUnitId: null },

  lovia:    { id: "lovia",    name: "Lovia",    email: "lovia@email.com",    role: ROLES.FINANCE, avatar: "", unitId: null, subUnitId: null },
  didi:     { id: "didi",     name: "Didi",     email: "didi@email.com",     role: ROLES.HR,      avatar: "", unitId: null, subUnitId: null },

  satya:    { id: "satya",    name: "Satya",    email: "satya@email.com",    role: ROLES.LEADER,  avatar: "", unitId: "aquaculture", subUnitId: null },
  taufik:   { id: "taufik",   name: "Taufik",   email: "taufik@email.com",   role: ROLES.LEADER,  avatar: "", unitId: "tanjung",     subUnitId: null },
  fahrizal: { id: "fahrizal", name: "Fahrizal", email: "fahrizal@email.com", role: ROLES.LEADER,  avatar: "", unitId: "xpanca",      subUnitId: null },
  sugianto: { id: "sugianto", name: "Sugianto", email: "sugianto@email.com", role: ROLES.LEADER,  avatar: "", unitId: "pixel",       subUnitId: null },
  ferry:    { id: "ferry",    name: "Ferry",    email: "ferry@email.com",    role: ROLES.LEADER,  avatar: "", unitId: "retail",      subUnitId: null },

  rafli:    { id: "rafli",    name: "Rafli",    email: "rafli@email.com",    role: ROLES.PIC, avatar: "", unitId: "aquaculture", subUnitId: "aqua-cerelek" },
  wahyu:    { id: "wahyu",    name: "Wahyu",    email: "wahyu@email.com",    role: ROLES.PIC, avatar: "", unitId: "aquaculture", subUnitId: "aqua-cisampih" },
  hendra:   { id: "hendra",   name: "Hendra",   email: "hendra@email.com",   role: ROLES.PIC, avatar: "", unitId: "tanjung",     subUnitId: "tjg-blok-a" },
  andi:     { id: "andi",     name: "Andi",     email: "andi@email.com",     role: ROLES.PIC, avatar: "", unitId: "pixel",       subUnitId: "pix-bdg-pusat" },
  rina:     { id: "rina",     name: "Rina",     email: "rina@email.com",     role: ROLES.PIC, avatar: "", unitId: "pixel",       subUnitId: "pix-bdg-timur" },
  bayu:     { id: "bayu",     name: "Bayu",     email: "bayu@email.com",     role: ROLES.PIC, avatar: "", unitId: "retail",      subUnitId: "rtl-outlet1" },
};

/** @type {Record<string, Unit>} */
// `let` (lihat catatan pada USERS) — diisi dari API saat bootstrap.
let UNITS = {
  pixel:       { id: "pixel",       name: "Pixel Telemedia", leaderId: "sugianto", color: "#3B7BC4", colorDark: "#2C5F9E", colorLight: "#E7F0F8", icon: "signal" },
  retail:      { id: "retail",      name: "KK / Retail",     leaderId: "ferry",    color: "#C9A45C", colorDark: "#9A7B3E", colorLight: "#F4ECDB", icon: "store" },
  aquaculture: { id: "aquaculture", name: "Aquaculture",     leaderId: "satya",    color: "#5B9B47", colorDark: "#3F6E31", colorLight: "#EAF3E5", icon: "fish" },
  tanjung:     { id: "tanjung",     name: "Kolam Tanjung",   leaderId: "taufik",   color: "#3B9BA4", colorDark: "#2A6E75", colorLight: "#E4F2F3", icon: "water" },
  xpanca:      { id: "xpanca",      name: "Xpanca",          leaderId: "fahrizal", color: "#7A6CB0", colorDark: "#564B80", colorLight: "#ECE9F4", icon: "cog" },
  menjala:     { id: "menjala",     name: "Menjala",         leaderId: null,       color: "#6B6B76", colorDark: "#46464E", colorLight: "#F0F0F2", icon: "fish" },
};

/** @type {SubUnit[]} */
const SUB_UNITS = [
  { id: "aqua-cerelek",   unitId: "aquaculture", name: "Kolam Cerelek",        picId: "rafli",  icon: "fish", status: "active", createdAt: "2025-08-15" },
  { id: "aqua-cisampih",  unitId: "aquaculture", name: "Kolam Cisampih",       picId: "wahyu",  icon: "water", status: "active", createdAt: "2025-08-15" },
  { id: "aqua-ciwastra",  unitId: "aquaculture", name: "Kolam Ciwastra",       picId: null,     icon: "fish", status: "active", createdAt: "2026-01-10" },

  { id: "tjg-blok-a",     unitId: "tanjung",     name: "Tanjung Blok A",       picId: "hendra", icon: "water", status: "active", createdAt: "2025-09-01" },
  { id: "tjg-blok-b",     unitId: "tanjung",     name: "Tanjung Blok B",       picId: null,     icon: "water", status: "active", createdAt: "2025-09-01" },

  { id: "pix-bdg-pusat",  unitId: "pixel",       name: "Cabang Bandung Pusat", picId: "andi",   icon: "signal", status: "active", createdAt: "2024-03-01" },
  { id: "pix-bdg-timur",  unitId: "pixel",       name: "Cabang Bandung Timur", picId: "rina",   icon: "signal", status: "active", createdAt: "2026-03-15" },

  { id: "rtl-outlet1",    unitId: "retail",      name: "Outlet Dago",          picId: "bayu",   icon: "store", status: "active", createdAt: "2025-06-01" },
  { id: "rtl-outlet2",    unitId: "retail",      name: "Outlet Setiabudi",     picId: null,     icon: "store", status: "active", createdAt: "2025-11-01" },

  { id: "xpc-main",       unitId: "xpanca",      name: "Xpanca Utama",         picId: null,     icon: "cog", status: "active", createdAt: "2024-01-01" },
];

/**
 * @deprecated NO LONGER USED AS A DATA SOURCE (since the data unification).
 * Sub-unit scores are now DERIVED from KPI_SUBMISSIONS via the Scoring Engine
 * (see deriveScoreFromSubmission / getSubUnitSnapshotForPeriod).
 *
 * This array is kept only as historical reference and can be safely deleted.
 * Do not read from it — it will not reflect current data.
 *
 * @type {KPISnapshot[]}
 */
const KPI_SNAPSHOTS = [
  // Mei 2026 closings
  { id: "kp-001", subUnitId: "aqua-cerelek",   score: 87, weight: 40, period: "Mei 2026", closedAt: "2026-05-28" },
  { id: "kp-002", subUnitId: "aqua-cisampih",  score: 78, weight: 35, period: "Mei 2026", closedAt: "2026-05-22" },
  // aqua-ciwastra: no closing in Mei (siklus still running)

  { id: "kp-003", subUnitId: "tjg-blok-a",     score: 88, weight: 60, period: "Mei 2026", closedAt: "2026-05-31" },
  { id: "kp-004", subUnitId: "tjg-blok-b",     score: 72, weight: 40, period: "Mei 2026", closedAt: "2026-05-31" },

  { id: "kp-005", subUnitId: "pix-bdg-pusat",  score: 82, weight: 70, period: "Mei 2026", closedAt: "2026-05-31" },
  { id: "kp-006", subUnitId: "pix-bdg-timur",  score: 64, weight: 30, period: "Mei 2026", closedAt: "2026-05-31" },

  { id: "kp-007", subUnitId: "rtl-outlet1",    score: 75, weight: 60, period: "Mei 2026", closedAt: "2026-05-31" },
  { id: "kp-008", subUnitId: "rtl-outlet2",    score: 68, weight: 40, period: "Mei 2026", closedAt: "2026-05-31" },

  { id: "kp-009", subUnitId: "xpc-main",       score: 86, weight: 100, period: "Mei 2026", closedAt: "2026-05-31" },

  // Apr 2026 closings (for YTD demo)
  { id: "kp-h01", subUnitId: "tjg-blok-a",     score: 84, weight: 60, period: "Apr 2026", closedAt: "2026-04-30" },
  { id: "kp-h02", subUnitId: "tjg-blok-b",     score: 68, weight: 40, period: "Apr 2026", closedAt: "2026-04-30" },
  { id: "kp-h03", subUnitId: "pix-bdg-pusat",  score: 79, weight: 70, period: "Apr 2026", closedAt: "2026-04-30" },
  { id: "kp-h04", subUnitId: "pix-bdg-timur",  score: 58, weight: 30, period: "Apr 2026", closedAt: "2026-04-30" },
  { id: "kp-h05", subUnitId: "rtl-outlet1",    score: 72, weight: 60, period: "Apr 2026", closedAt: "2026-04-30" },
  { id: "kp-h06", subUnitId: "rtl-outlet2",    score: 70, weight: 40, period: "Apr 2026", closedAt: "2026-04-30" },
  { id: "kp-h07", subUnitId: "xpc-main",       score: 83, weight: 100, period: "Apr 2026", closedAt: "2026-04-30" },

  // Feb 2026 closing (Aquaculture siklus)
  { id: "kp-h08", subUnitId: "aqua-cerelek",   score: 91, weight: 40, period: "Feb 2026", closedAt: "2026-02-15" },
];

/**
 * @deprecated NO LONGER USED AS A DATA SOURCE (since the data unification).
 * Margin is now DERIVED from KPI_SUBMISSIONS via the Scoring Engine
 * (see deriveMarginFromSubmission / getDerivedMarginEntries).
 *
 * This array is kept only as historical reference and can be safely deleted.
 * Do not read from it — it will not reflect current data.
 *
 * @type {MarginEntry[]}
 */
const MARGIN_ENTRIES = [
  // Aquaculture — siklus-based, mixed status
  { id: "mg-001", subUnitId: "aqua-cerelek",  unitId: "aquaculture", kpiType: "cycle",   status: "closed",    targetMargin:  85000000, actualMargin:  92000000, period: "Siklus Feb-Mei 2026", closedAt: "2026-05-28", expectedCloseAt: "2026-05-28" },
  { id: "mg-002", subUnitId: "aqua-cerelek",  unitId: "aquaculture", kpiType: "cycle",   status: "approved",  targetMargin:  95000000, actualMargin:  0,        period: "Siklus Mei-Agu 2026", closedAt: null,         expectedCloseAt: "2026-08-25" },
  { id: "mg-003", subUnitId: "aqua-cisampih", unitId: "aquaculture", kpiType: "cycle",   status: "closed",    targetMargin:  70000000, actualMargin:  58000000, period: "Siklus Feb-Mei 2026", closedAt: "2026-05-22", expectedCloseAt: "2026-05-22" },
  { id: "mg-004", subUnitId: "aqua-cisampih", unitId: "aquaculture", kpiType: "cycle",   status: "approved",  targetMargin:  80000000, actualMargin:  0,        period: "Siklus Mei-Agu 2026", closedAt: null,         expectedCloseAt: "2026-08-20" },
  { id: "mg-005", subUnitId: "aqua-ciwastra", unitId: "aquaculture", kpiType: "cycle",   status: "estimated", targetMargin:  60000000, actualMargin:  0,        period: "Siklus Apr-Jul 2026", closedAt: null,         expectedCloseAt: "2026-07-15" },

  // Tanjung — monthly + siklus
  { id: "mg-101", subUnitId: "tjg-blok-a",    unitId: "tanjung",     kpiType: "monthly", status: "closed",    targetMargin:  40000000, actualMargin:  37500000, period: "Mei 2026",            closedAt: "2026-05-31", expectedCloseAt: "2026-05-31" },
  { id: "mg-102", subUnitId: "tjg-blok-b",    unitId: "tanjung",     kpiType: "monthly", status: "closed",    targetMargin:  30000000, actualMargin:  21000000, period: "Mei 2026",            closedAt: "2026-05-31", expectedCloseAt: "2026-05-31" },

  // Pixel — monthly
  { id: "mg-201", subUnitId: "pix-bdg-pusat", unitId: "pixel",       kpiType: "monthly", status: "closed",    targetMargin: 350000000, actualMargin: 412000000, period: "Mei 2026",            closedAt: "2026-05-31", expectedCloseAt: "2026-05-31" },
  { id: "mg-202", subUnitId: "pix-bdg-timur", unitId: "pixel",       kpiType: "monthly", status: "closed",    targetMargin: 150000000, actualMargin:  96000000, period: "Mei 2026",            closedAt: "2026-05-31", expectedCloseAt: "2026-05-31" },

  // Retail — monthly
  { id: "mg-301", subUnitId: "rtl-outlet1",   unitId: "retail",      kpiType: "monthly", status: "closed",    targetMargin:  85000000, actualMargin:  72000000, period: "Mei 2026",            closedAt: "2026-05-31", expectedCloseAt: "2026-05-31" },
  { id: "mg-302", subUnitId: "rtl-outlet2",   unitId: "retail",      kpiType: "monthly", status: "closed",    targetMargin:  55000000, actualMargin:  44000000, period: "Mei 2026",            closedAt: "2026-05-31", expectedCloseAt: "2026-05-31" },

  // Xpanca — monthly
  { id: "mg-401", subUnitId: "xpc-main",      unitId: "xpanca",      kpiType: "monthly", status: "closed",    targetMargin: 120000000, actualMargin: 138000000, period: "Mei 2026",            closedAt: "2026-05-31", expectedCloseAt: "2026-05-31" },

  // Historical data (Apr 2026 closings) for YTD demo
  { id: "mg-h01", subUnitId: "tjg-blok-a",    unitId: "tanjung",     kpiType: "monthly", status: "closed",    targetMargin:  38000000, actualMargin:  35000000, period: "Apr 2026",            closedAt: "2026-04-30", expectedCloseAt: "2026-04-30" },
  { id: "mg-h02", subUnitId: "tjg-blok-b",    unitId: "tanjung",     kpiType: "monthly", status: "closed",    targetMargin:  28000000, actualMargin:  19000000, period: "Apr 2026",            closedAt: "2026-04-30", expectedCloseAt: "2026-04-30" },
  { id: "mg-h03", subUnitId: "pix-bdg-pusat", unitId: "pixel",       kpiType: "monthly", status: "closed",    targetMargin: 340000000, actualMargin: 395000000, period: "Apr 2026",            closedAt: "2026-04-30", expectedCloseAt: "2026-04-30" },
  { id: "mg-h04", subUnitId: "pix-bdg-timur", unitId: "pixel",       kpiType: "monthly", status: "closed",    targetMargin: 145000000, actualMargin:  82000000, period: "Apr 2026",            closedAt: "2026-04-30", expectedCloseAt: "2026-04-30" },
  { id: "mg-h05", subUnitId: "rtl-outlet1",   unitId: "retail",      kpiType: "monthly", status: "closed",    targetMargin:  80000000, actualMargin:  68000000, period: "Apr 2026",            closedAt: "2026-04-30", expectedCloseAt: "2026-04-30" },
  { id: "mg-h06", subUnitId: "rtl-outlet2",   unitId: "retail",      kpiType: "monthly", status: "closed",    targetMargin:  50000000, actualMargin:  41000000, period: "Apr 2026",            closedAt: "2026-04-30", expectedCloseAt: "2026-04-30" },
  { id: "mg-h07", subUnitId: "xpc-main",      unitId: "xpanca",      kpiType: "monthly", status: "closed",    targetMargin: 115000000, actualMargin: 122000000, period: "Apr 2026",            closedAt: "2026-04-30", expectedCloseAt: "2026-04-30" },

  // Aquaculture closing earlier (Feb-2026 closing)
  { id: "mg-h08", subUnitId: "aqua-cerelek",  unitId: "aquaculture", kpiType: "cycle",   status: "closed",    targetMargin:  80000000, actualMargin:  88000000, period: "Siklus Nov-Feb 2026", closedAt: "2026-02-15", expectedCloseAt: "2026-02-15" },
];

/**
 * Projects across all units. Some are tied to specific sub-units, some are unit-level.
 * @type {Project[]}
 */
const PROJECTS = [
  // Aquaculture
  { id: "pj-001", unitId: "aquaculture", subUnitId: "aqua-cerelek",  name: "Pembukaan Kolam Cerelek 2",     desc: "Ekspansi 8 kolam baru kapasitas 5 ton/siklus",   status: "on_track", milestonesTotal: 7, milestonesDone: 3, budgetPlanned: 180000000, budgetSpent:  67000000, startDate: "2026-01-15", endDate: "2026-12-31" },
  { id: "pj-002", unitId: "aquaculture", subUnitId: null,            name: "Implementasi Sistem Biofloc",   desc: "Migrasi semua kolam ke biofloc system",          status: "at_risk",  milestonesTotal: 5, milestonesDone: 1, budgetPlanned:  45000000, budgetSpent:  18000000, startDate: "2026-03-01", endDate: "2026-09-30" },

  // Tanjung
  { id: "pj-101", unitId: "tanjung",     subUnitId: "tjg-blok-a",    name: "Instalasi Filter Multi-tahap",  desc: "Sistem filter 10x2m zigzag + UV sterilization",  status: "on_track", milestonesTotal: 8, milestonesDone: 5, budgetPlanned:  43000000, budgetSpent:  26000000, startDate: "2026-04-01", endDate: "2026-07-31" },

  // Pixel
  { id: "pj-201", unitId: "pixel",       subUnitId: "pix-bdg-timur", name: "Setup Cabang Bandung Timur",    desc: "Buka cabang baru target 5rb trx/bulan",          status: "on_track", milestonesTotal: 6, milestonesDone: 4, budgetPlanned:  45000000, budgetSpent:  22000000, startDate: "2026-03-01", endDate: "2026-09-30" },
  { id: "pj-202", unitId: "pixel",       subUnitId: null,            name: "Upgrade Sistem POS",            desc: "Ganti sistem kasir ke POS terintegrasi",         status: "behind",   milestonesTotal: 5, milestonesDone: 1, budgetPlanned:  28000000, budgetSpent:  19000000, startDate: "2026-02-01", endDate: "2026-06-30" },

  // Retail
  { id: "pj-301", unitId: "retail",      subUnitId: null,            name: "Rebranding Gera Creative",      desc: "Redesign identitas brand & website",             status: "behind",   milestonesTotal: 5, milestonesDone: 2, budgetPlanned:  35000000, budgetSpent:  28000000, startDate: "2026-01-15", endDate: "2026-06-30" },
  { id: "pj-302", unitId: "retail",      subUnitId: "rtl-outlet2",   name: "Renovasi Outlet Setiabudi",     desc: "Renovasi interior & signage outlet baru",        status: "on_track", milestonesTotal: 6, milestonesDone: 5, budgetPlanned:  52000000, budgetSpent:  45000000, startDate: "2026-02-01", endDate: "2026-06-15" },

  // Xpanca
  { id: "pj-401", unitId: "xpanca",      subUnitId: null,            name: "Pengembangan Software Distribusi", desc: "Sistem digital order, stok, laporan",         status: "at_risk",  milestonesTotal: 7, milestonesDone: 2, budgetPlanned:  85000000, budgetSpent:  18000000, startDate: "2026-02-01", endDate: "2026-08-31" },
];

/**
 * Formula Library — built-in formulas Bapak can pick from when creating templates.
 * Each formula declares its inputs (other field names in same form) and the expression.
 *
 * Adding a new formula = just add an entry here. Field names in `inputs` must match
 * field names used in templates (case-sensitive).
 */
const FORMULA_LIBRARY = [
  {
    id: "sr",
    name: "SR (Survival Rate)",
    description: "Tingkat hidup dari tebar ke panen",
    formula: "(Panen / Tebar) × 100",
    inputs: ["Tebar", "Panen"],
    satuan: "%",
    compute: (v) => v["Tebar"] > 0 ? (v["Panen"] / v["Tebar"] * 100) : 0,
  },
  {
    id: "fcr",
    name: "FCR (Feed Conversion Ratio)",
    description: "Efisiensi konversi pakan jadi daging",
    formula: "Pakan / Berat_Panen",
    inputs: ["Pakan", "Berat_Panen"],
    satuan: "x",
    compute: (v) => v["Berat_Panen"] > 0 ? (v["Pakan"] / v["Berat_Panen"]) : 0,
  },
  {
    id: "hpp",
    name: "HPP (Harga Pokok Produksi)",
    description: "Biaya produksi per kg",
    formula: "Total_Biaya / Berat_Panen",
    inputs: ["Total_Biaya", "Berat_Panen"],
    satuan: "Rp/kg",
    compute: (v) => v["Berat_Panen"] > 0 ? (v["Total_Biaya"] / v["Berat_Panen"]) : 0,
  },
  {
    id: "omset",
    name: "Omset",
    description: "Total penjualan dari panen",
    formula: "Berat_Panen × Harga_Jual",
    inputs: ["Berat_Panen", "Harga_Jual"],
    satuan: "Rp",
    compute: (v) => (v["Berat_Panen"] || 0) * (v["Harga_Jual"] || 0),
  },
  {
    id: "margin",
    name: "Margin (Laba Bersih)",
    description: "Omset dikurangi total biaya",
    formula: "Omset - Total_Biaya",
    inputs: ["Omset", "Total_Biaya"],
    satuan: "Rp",
    compute: (v) => (v["Omset"] || 0) - (v["Total_Biaya"] || 0),
  },
  {
    id: "margin_pct",
    name: "Margin %",
    description: "Persentase margin terhadap omset",
    formula: "(Margin / Omset) × 100",
    inputs: ["Margin", "Omset"],
    satuan: "%",
    compute: (v) => v["Omset"] > 0 ? (v["Margin"] / v["Omset"] * 100) : 0,
  },
  {
    id: "roi",
    name: "ROI (Return on Investment)",
    description: "Pengembalian terhadap modal",
    formula: "(Margin / Modal) × 100",
    inputs: ["Margin", "Modal"],
    satuan: "%",
    compute: (v) => v["Modal"] > 0 ? (v["Margin"] / v["Modal"] * 100) : 0,
  },
  {
    id: "mortalitas",
    name: "Mortalitas",
    description: "Persentase kematian",
    formula: "((Tebar - Panen) / Tebar) × 100",
    inputs: ["Tebar", "Panen"],
    satuan: "%",
    compute: (v) => v["Tebar"] > 0 ? ((v["Tebar"] - v["Panen"]) / v["Tebar"] * 100) : 0,
  },
  {
    id: "avg_per_trx",
    name: "Rata² per Transaksi",
    description: "Nilai rata-rata per transaksi",
    formula: "Omset / Jumlah_Transaksi",
    inputs: ["Omset", "Jumlah_Transaksi"],
    satuan: "Rp",
    compute: (v) => v["Jumlah_Transaksi"] > 0 ? (v["Omset"] / v["Jumlah_Transaksi"]) : 0,
  },
  {
    id: "aktivasi_agen",
    name: "Aktivasi_Agen",
    description: "Persentase agen yang aktif",
    formula: "(Agen_Aktif / Total_Agen) × 100",
    inputs: ["Agen_Aktif", "Total_Agen"],
    satuan: "%",
    compute: (v) => v["Total_Agen"] > 0 ? (v["Agen_Aktif"] / v["Total_Agen"] * 100) : 0,
  },

  // ── Reverse-direction formulas (input rasio → hitung nilai mentah) ──
  // Dipakai oleh Kolam Deder & Kolam Pembesaran, di mana SR & FCR diinput manual.
  {
    id: "panen_dari_sr",
    name: "Panen (dari SR)",
    description: "Jumlah ekor panen dihitung dari SR dan tebar",
    formula: "Tebar × SR / 100",
    inputs: ["Tebar", "SR"],
    satuan: "ekor",
    compute: (v) => (v["Tebar"] || 0) * (v["SR"] || 0) / 100,
  },
  {
    id: "berat_dari_bobot",
    name: "Berat Panen (dari Bobot per Ekor)",
    description: "Total berat panen dari bobot per ekor × jumlah panen",
    formula: "Bobot_per_Ekor × Panen / 1000",
    inputs: ["Bobot_per_Ekor", "Panen"],
    satuan: "kg",
    compute: (v) => (v["Bobot_per_Ekor"] || 0) * (v["Panen"] || 0) / 1000,
  },
  {
    id: "pakan_dari_fcr",
    name: "Pakan (dari FCR)",
    description: "Total pakan dihitung dari FCR × berat panen",
    formula: "FCR × Berat_Panen",
    inputs: ["FCR", "Berat_Panen"],
    satuan: "kg",
    compute: (v) => (v["FCR"] || 0) * (v["Berat_Panen"] || 0),
  },
  {
    id: "populasi_dari_kg",
    name: "Populasi (dari Kg Tebar)",
    description: "Jumlah ekor benih dari berat tebar dibagi ukuran per ekor",
    formula: "Kg_Tebar × 1000 / Ukuran_Tebar",
    inputs: ["Kg_Tebar", "Ukuran_Tebar"],
    satuan: "ekor",
    compute: (v) => (v["Ukuran_Tebar"] || 0) > 0 ? (v["Kg_Tebar"] || 0) * 1000 / v["Ukuran_Tebar"] : 0,
  },
  {
    id: "hpp_benih_ekor",
    name: "HPP Benih (per ekor)",
    description: "Total biaya benih = harga per ekor × jumlah tebar",
    formula: "Harga_Benih_per_ekor × Tebar",
    inputs: ["Harga_Benih_per_ekor", "Tebar"],
    satuan: "Rp",
    compute: (v) => (v["Harga_Benih_per_ekor"] || 0) * (v["Tebar"] || 0),
  },
  {
    id: "hpp_benih_kg",
    name: "HPP Benih (per kg)",
    description: "Total biaya benih = harga per kg × kg tebar",
    formula: "Harga_Benih_per_kg × Kg_Tebar",
    inputs: ["Harga_Benih_per_kg", "Kg_Tebar"],
    satuan: "Rp",
    compute: (v) => (v["Harga_Benih_per_kg"] || 0) * (v["Kg_Tebar"] || 0),
  },
  {
    id: "hpp_pakan",
    name: "HPP_Pakan",
    description: "Total biaya pakan = harga pakan × kebutuhan pakan",
    formula: "Harga_Pakan × Pakan",
    inputs: ["Harga_Pakan", "Pakan"],
    satuan: "Rp",
    compute: (v) => (v["Harga_Pakan"] || 0) * (v["Pakan"] || 0),
  },
  {
    id: "total_biaya_komponen",
    name: "Total Biaya (dari komponen)",
    description: "Jumlah semua komponen biaya termasuk benih & pakan",
    formula: "Borongan + (Biaya/kg Panen + Pemeliharaan/kg) × kg panen + CapEx + Lain-lain + HPP_Benih + HPP_Pakan",
    inputs: ["Biaya_Borongan_Panen", "Biaya_per_kg_Panen", "Biaya_Pemeliharaan_per_kg", "Berat_Panen", "Biaya_CapEx", "Biaya_Lain-lain", "HPP_Benih", "HPP_Pakan"],
    satuan: "Rp",
    compute: (v) =>
      (v["Biaya_Borongan_Panen"] || 0) +
      ((v["Biaya_per_kg_Panen"] || 0) + (v["Biaya_Pemeliharaan_per_kg"] || 0)) * (v["Berat_Panen"] || 0) +
      (v["Biaya_CapEx"] || 0) +
      (v["Biaya_Lain-lain"] || 0) +
      (v["HPP_Benih"] || 0) +
      (v["HPP_Pakan"] || 0),
  },
  {
    id: "hpp_dari_total",
    name: "HPP per kg (dari Total Biaya)",
    description: "Harga pokok produksi per kg dari total biaya gabungan",
    formula: "Total_Biaya / Berat_Panen",
    inputs: ["Total_Biaya", "Berat_Panen"],
    satuan: "Rp/kg",
    compute: (v) => v["Berat_Panen"] > 0 ? (v["Total_Biaya"] / v["Berat_Panen"]) : 0,
  },
  {
    id: "margin_dari_total",
    name: "Margin (dari Total Biaya)",
    description: "Omset dikurangi total biaya gabungan",
    formula: "Omset - Total_Biaya",
    inputs: ["Omset", "Total_Biaya"],
    satuan: "Rp",
    compute: (v) => (v["Omset"] || 0) - (v["Total_Biaya"] || 0),
  },
];

/**
 * Form Templates — Bapak rancang sekali, dipakai untuk banyak sub-unit.
 * @type {FormTemplate[]}
 */
const FORM_TEMPLATES = [
  {
    id: "tpl-kolam-deder",
    name: "Kolam Deder",
    description: "Template KPI untuk siklus pendederan ikan (larva → benih)",
    frequency: "cycle",
    createdAt: "2026-01-10",
    fields: [
      { id: "f1",  name: "Tanggal_Tebar",            type: "date",   satuan: "",      source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f2",  name: "Tanggal_Panen",            type: "date",   satuan: "",      source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f3",  name: "Tebar",                    type: "number", satuan: "ekor",  source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f4",  name: "SR",                       type: "number", satuan: "%",     source: "Manual",    formulaId: null,                  defaultWeight: 25, isMargin: false },
      { id: "f5",  name: "Bobot_per_Ekor",           type: "number", satuan: "gr",    source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f6",  name: "FCR",                      type: "number", satuan: "x",     source: "Manual",    formulaId: null,                  defaultWeight: 25, isMargin: false },
      { id: "f7",  name: "Harga_Jual",               type: "number", satuan: "Rp",    source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f8",  name: "Harga_Benih_per_ekor",     type: "number", satuan: "Rp",    source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f9",  name: "Harga_Pakan",              type: "number", satuan: "Rp/kg", source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f10", name: "Biaya_Borongan_Panen",     type: "number", satuan: "Rp",    source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f11", name: "Biaya_per_kg_Panen",       type: "number", satuan: "Rp/kg", source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f12", name: "Biaya_Pemeliharaan_per_kg",type: "number", satuan: "Rp/kg", source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f13", name: "Biaya_CapEx",              type: "number", satuan: "Rp",    source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f14", name: "Biaya_Lain-lain",          type: "number", satuan: "Rp",    source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f15", name: "Panen",                    type: "auto",   satuan: "ekor",  source: "Formula",   formulaId: "panen_dari_sr",       defaultWeight: 0,  isMargin: false },
      { id: "f16", name: "Berat_Panen",              type: "auto",   satuan: "kg",    source: "Formula",   formulaId: "berat_dari_bobot",    defaultWeight: 0,  isMargin: false },
      { id: "f17", name: "Pakan",                    type: "auto",   satuan: "kg",    source: "Formula",   formulaId: "pakan_dari_fcr",      defaultWeight: 0,  isMargin: false },
      { id: "f18", name: "HPP_Benih",                type: "auto",   satuan: "Rp",    source: "Formula",   formulaId: "hpp_benih_ekor",      defaultWeight: 0,  isMargin: false },
      { id: "f19", name: "HPP_Pakan",                type: "auto",   satuan: "Rp",    source: "Formula",   formulaId: "hpp_pakan",           defaultWeight: 0,  isMargin: false },
      { id: "f20", name: "Total_Biaya",              type: "auto",   satuan: "Rp",    source: "Formula",   formulaId: "total_biaya_komponen",defaultWeight: 0,  isMargin: false },
      { id: "f21", name: "HPP",                      type: "auto",   satuan: "Rp/kg", source: "Formula",   formulaId: "hpp_dari_total",      defaultWeight: 25, isMargin: false },
      { id: "f22", name: "Omset",                    type: "auto",   satuan: "Rp",    source: "Formula",   formulaId: "omset",               defaultWeight: 0,  isMargin: false },
      { id: "f23", name: "Margin",                   type: "auto",   satuan: "Rp",    source: "Formula",   formulaId: "margin_dari_total",   defaultWeight: 25, isMargin: true  },
    ],
  },
  {
    id: "tpl-kolam-pembesaran",
    name: "Kolam Pembesaran",
    description: "Template KPI untuk siklus pembesaran ikan konsumsi",
    frequency: "cycle",
    createdAt: "2026-01-10",
    fields: [
      { id: "f1",  name: "Tanggal_Tebar",            type: "date",   satuan: "",      source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f2",  name: "Tanggal_Panen",            type: "date",   satuan: "",      source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f3",  name: "Kg_Tebar",                 type: "number", satuan: "kg",    source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f4",  name: "Ukuran_Tebar",             type: "number", satuan: "gr",    source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f5",  name: "SR",                       type: "number", satuan: "%",     source: "Manual",    formulaId: null,                  defaultWeight: 25, isMargin: false },
      { id: "f6",  name: "Bobot_per_Ekor",           type: "number", satuan: "gr",    source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f7",  name: "FCR",                      type: "number", satuan: "x",     source: "Manual",    formulaId: null,                  defaultWeight: 25, isMargin: false },
      { id: "f8",  name: "Harga_Jual",               type: "number", satuan: "Rp",    source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f9",  name: "Harga_Benih_per_kg",       type: "number", satuan: "Rp/kg", source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f10", name: "Harga_Pakan",              type: "number", satuan: "Rp/kg", source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f11", name: "Biaya_Borongan_Panen",     type: "number", satuan: "Rp",    source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f12", name: "Biaya_per_kg_Panen",       type: "number", satuan: "Rp/kg", source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f13", name: "Biaya_Pemeliharaan_per_kg",type: "number", satuan: "Rp/kg", source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f14", name: "Biaya_CapEx",              type: "number", satuan: "Rp",    source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f15", name: "Biaya_Lain-lain",          type: "number", satuan: "Rp",    source: "Manual",    formulaId: null,                  defaultWeight: 0,  isMargin: false },
      { id: "f16", name: "Tebar",                    type: "auto",   satuan: "ekor",  source: "Formula",   formulaId: "populasi_dari_kg",    defaultWeight: 0,  isMargin: false },
      { id: "f17", name: "Panen",                    type: "auto",   satuan: "ekor",  source: "Formula",   formulaId: "panen_dari_sr",       defaultWeight: 0,  isMargin: false },
      { id: "f18", name: "Berat_Panen",              type: "auto",   satuan: "kg",    source: "Formula",   formulaId: "berat_dari_bobot",    defaultWeight: 0,  isMargin: false },
      { id: "f19", name: "Pakan",                    type: "auto",   satuan: "kg",    source: "Formula",   formulaId: "pakan_dari_fcr",      defaultWeight: 0,  isMargin: false },
      { id: "f20", name: "HPP_Benih",                type: "auto",   satuan: "Rp",    source: "Formula",   formulaId: "hpp_benih_kg",        defaultWeight: 0,  isMargin: false },
      { id: "f21", name: "HPP_Pakan",                type: "auto",   satuan: "Rp",    source: "Formula",   formulaId: "hpp_pakan",           defaultWeight: 0,  isMargin: false },
      { id: "f22", name: "Total_Biaya",              type: "auto",   satuan: "Rp",    source: "Formula",   formulaId: "total_biaya_komponen",defaultWeight: 0,  isMargin: false },
      { id: "f23", name: "HPP",                      type: "auto",   satuan: "Rp/kg", source: "Formula",   formulaId: "hpp_dari_total",      defaultWeight: 25, isMargin: false },
      { id: "f24", name: "Omset",                    type: "auto",   satuan: "Rp",    source: "Formula",   formulaId: "omset",               defaultWeight: 0,  isMargin: false },
      { id: "f25", name: "Margin",                   type: "auto",   satuan: "Rp",    source: "Formula",   formulaId: "margin_dari_total",   defaultWeight: 25, isMargin: true  },
    ],
  },
  {
    id: "tpl-cabang-pulsa",
    name: "Cabang Pulsa Bulanan",
    description: "Template KPI bulanan untuk cabang distribusi pulsa",
    frequency: "monthly",
    createdAt: "2026-01-15",
    fields: [
      { id: "f1", name: "Jumlah_Transaksi", type: "number", satuan: "trx",   source: "Manual",     formulaId: null,           defaultWeight: 25, isMargin: false },
      { id: "f2", name: "Omset",            type: "number", satuan: "Rp",   source: "Pembukuan",  formulaId: null,           defaultWeight: 25, isMargin: false },
      { id: "f3", name: "Total_Biaya",      type: "number", satuan: "Rp",   source: "Pembukuan",  formulaId: null,           defaultWeight: 0,  isMargin: false },
      { id: "f4", name: "Total_Agen",       type: "number", satuan: "orang",source: "Manual",     formulaId: null,           defaultWeight: 0,  isMargin: false },
      { id: "f5", name: "Agen_Aktif",       type: "number", satuan: "orang",source: "Manual",     formulaId: null,           defaultWeight: 0,  isMargin: false },
      { id: "f6", name: "Aktivasi_Agen",    type: "auto",   satuan: "%",    source: "Formula",    formulaId: "aktivasi_agen",defaultWeight: 20, isMargin: false },
      { id: "f7", name: "Rata²_per_Trx",    type: "auto",   satuan: "Rp",   source: "Formula",    formulaId: "avg_per_trx",  defaultWeight: 10, isMargin: false },
      { id: "f8", name: "Margin",           type: "auto",   satuan: "Rp",   source: "Formula",    formulaId: "margin",       defaultWeight: 20, isMargin: true  },
    ],
  },
  {
    id: "tpl-outlet-retail",
    name: "Outlet Retail Bulanan",
    description: "Template KPI bulanan untuk outlet retail",
    frequency: "monthly",
    createdAt: "2026-02-01",
    fields: [
      { id: "f1", name: "Omset",            type: "number", satuan: "Rp",   source: "Pembukuan",  formulaId: null,         defaultWeight: 30, isMargin: false },
      { id: "f2", name: "Total_Biaya",      type: "number", satuan: "Rp",   source: "Pembukuan",  formulaId: null,         defaultWeight: 0,  isMargin: false },
      { id: "f3", name: "Jumlah_Pelanggan", type: "number", satuan: "orang",source: "Manual",     formulaId: null,         defaultWeight: 20, isMargin: false },
      { id: "f4", name: "Stock_Loss",       type: "number", satuan: "Rp",   source: "Manual",     formulaId: null,         defaultWeight: 20, isMargin: false },
      { id: "f5", name: "Margin",           type: "auto",   satuan: "Rp",   source: "Formula",    formulaId: "margin",     defaultWeight: 30, isMargin: true  },
    ],
  },
];

/**
 * KPI Submissions — instance pemakaian template.
 * For prototype, we have a few examples showing different lifecycle stages.
 * @type {KPISubmission[]}
 */
const KPI_SUBMISSIONS = [
  // Cerelek - already closed (Feb-May cycle)
  {
    id: "sub-001",
    templateId: "tpl-kolam-deder",
    subUnitId: "aqua-cerelek",
    unitId: "aquaculture",
    status: "closed",
    period: "Siklus Feb-Mei 2026",
    estimatedValues: { f3: 12000, f4: 85, f5: 250, f6: 1.2, f7: 22000, f8: 150, f9: 12000, f10: 1500000, f11: 1200, f12: 8000, f13: 3000000, f14: 1000000 },
    actualValues:    { f3: 12000, f4: 85, f5: 250, f6: 1.24, f7: 22000, f8: 150, f9: 12500, f10: 1800000, f11: 1300, f12: 8500, f13: 3000000, f14: 1200000 },
    fieldWeights:    { f4: 25, f6: 25, f21: 25, f23: 25 },
    subUnitWeight: 40,
    createdBy: "rafli",
    createdAt: "2026-02-10",
    approvedBy: "budhi",
    approvedAt: "2026-02-12",
    closedAt: "2026-05-28",
    closingNote: "Panen dilakukan H+105. SR sedikit di bawah target karena suhu malam turun di minggu ke-8.",
  },
  // Cerelek - ongoing (May-Aug cycle)
  {
    id: "sub-002",
    templateId: "tpl-kolam-deder",
    subUnitId: "aqua-cerelek",
    unitId: "aquaculture",
    status: "approved",
    period: "Siklus Mei-Agu 2026",
    estimatedValues: { f3: 13000, f4: 87, f5: 260, f6: 1.18, f7: 23000, f8: 155, f9: 12500, f10: 1600000, f11: 1250, f12: 8200, f13: 3000000, f14: 1100000 },
    actualValues: null,
    fieldWeights: { f4: 25, f6: 25, f21: 25, f23: 25 },
    subUnitWeight: 40,
    createdBy: "rafli",
    createdAt: "2026-05-15",
    approvedBy: "budhi",
    approvedAt: "2026-05-17",
    closedAt: null,
    closingNote: null,
  },
  // Cisampih - pending approval (estimated, not yet approved)
  {
    id: "sub-003",
    templateId: "tpl-kolam-deder",
    subUnitId: "aqua-cisampih",
    unitId: "aquaculture",
    status: "estimated",
    period: "Siklus Mei-Agu 2026",
    estimatedValues: { f3: 11000, f4: 84, f5: 240, f6: 1.25, f7: 22000, f8: 150, f9: 12000, f10: 1400000, f11: 1200, f12: 7800, f13: 2800000, f14: 900000 },
    actualValues: null,
    fieldWeights: {},  // not set yet by owner
    subUnitWeight: 35,
    createdBy: "wahyu",
    createdAt: "2026-05-20",
    approvedBy: null,
    approvedAt: null,
    closedAt: null,
    closingNote: null,
  },
  // Pixel Bandung Pusat - monthly, closed
  {
    id: "sub-004",
    templateId: "tpl-cabang-pulsa",
    subUnitId: "pix-bdg-pusat",
    unitId: "pixel",
    status: "approved",
    period: "Mei 2026",
    estimatedValues: { f1: 9500, f2: 380000000, f3: 32000000, f4: 150, f5: 130 },
    actualValues:    { f1: 9800, f2: 412000000, f3: 35000000, f4: 152, f5: 138 },
    fieldWeights: { f1: 25, f2: 25, f6: 20, f7: 10, f8: 20 },
    subUnitWeight: 70,
    createdBy: "andi",
    createdAt: "2026-05-01",
    approvedBy: "budhi",
    approvedAt: "2026-05-02",
    closedAt: null,
    closingNote: null,
  },
  // Pixel Bandung Timur - monthly, closed (cabang baru, performa di bawah target)
  {
    id: "sub-005",
    templateId: "tpl-cabang-pulsa",
    subUnitId: "pix-bdg-timur",
    unitId: "pixel",
    status: "closed",
    period: "Mei 2026",
    estimatedValues: { f1: 5000, f2: 150000000, f3: 12000000, f4: 80, f5: 65 },
    actualValues:    { f1: 4200, f2: 96000000, f3: 10000000, f4: 78, f5: 48 },
    fieldWeights: { f1: 25, f2: 25, f6: 20, f7: 10, f8: 20 },
    subUnitWeight: 30,
    createdBy: "rina",
    createdAt: "2026-05-01",
    approvedBy: "budhi",
    approvedAt: "2026-05-03",
    closedAt: "2026-05-31",
    closingNote: "Cabang baru (buka Mar 2026), masih tahap pengembangan jaringan agen. Margin 96jt dari target 150jt — agen aktif baru 48 dari 78 terdaftar. Fokus Juni: aktivasi agen tidur.",
  },
  // Tanjung Blok A - monthly, closed (score 88, margin 37.5jt/40jt)
  {
    id: "sub-006",
    templateId: "tpl-cabang-pulsa",
    subUnitId: "tjg-blok-a",
    unitId: "tanjung",
    status: "closed",
    period: "Mei 2026",
    estimatedValues: { f1: 6000, f2: 40000000, f3: 2500000, f4: 60, f5: 50 },
    actualValues:    { f1: 6300, f2: 37500000, f3: 2300000, f4: 62, f5: 54 },
    fieldWeights: { f1: 25, f2: 25, f6: 20, f7: 10, f8: 20 },
    subUnitWeight: 60,
    createdBy: "hendra",
    createdAt: "2026-05-01",
    approvedBy: "budhi",
    approvedAt: "2026-05-02",
    closedAt: "2026-05-31",
    closingNote: "Produksi stabil, margin 37.5jt mendekati target 40jt. Performa baik.",
  },
  // Tanjung Blok B - monthly, closed (score 72, margin 21jt/30jt). Belum punya PIC → Leader Taufik input.
  {
    id: "sub-007",
    templateId: "tpl-cabang-pulsa",
    subUnitId: "tjg-blok-b",
    unitId: "tanjung",
    status: "closed",
    period: "Mei 2026",
    estimatedValues: { f1: 4500, f2: 30000000, f3: 2000000, f4: 45, f5: 38 },
    actualValues:    { f1: 4000, f2: 21000000, f3: 1900000, f4: 44, f5: 30 },
    fieldWeights: { f1: 25, f2: 25, f6: 20, f7: 10, f8: 20 },
    subUnitWeight: 40,
    createdBy: "taufik",
    createdAt: "2026-05-01",
    approvedBy: "budhi",
    approvedAt: "2026-05-03",
    closedAt: "2026-05-31",
    closingNote: "Margin 21jt di bawah target 30jt. Blok B belum punya PIC tetap — input oleh Leader. Perlu penugasan PIC.",
  },
  // Outlet Dago (rtl-outlet1) - retail monthly, closed (score 75, margin 72jt/85jt)
  {
    id: "sub-008",
    templateId: "tpl-outlet-retail",
    subUnitId: "rtl-outlet1",
    unitId: "retail",
    status: "closed",
    period: "Mei 2026",
    estimatedValues: { f1: 85000000, f2: 0, f3: 1200, f4: 1500000 },
    actualValues:    { f1: 72000000, f2: 0, f3: 1150, f4: 1800000 },
    fieldWeights: { f1: 30, f3: 20, f4: 20, f5: 30 },
    subUnitWeight: 60,
    createdBy: "bayu",
    createdAt: "2026-05-01",
    approvedBy: "ferry",
    approvedAt: "2026-05-02",
    closedAt: "2026-05-31",
    closingNote: "Omset 72jt dari target 85jt. Stock loss naik sedikit, perlu kontrol inventaris.",
  },
  // Outlet Setiabudi (rtl-outlet2) - retail monthly, closed (score 68, margin 44jt/55jt). Belum punya PIC → Ferry input.
  {
    id: "sub-009",
    templateId: "tpl-outlet-retail",
    subUnitId: "rtl-outlet2",
    unitId: "retail",
    status: "closed",
    period: "Mei 2026",
    estimatedValues: { f1: 55000000, f2: 0, f3: 900, f4: 1200000 },
    actualValues:    { f1: 44000000, f2: 0, f3: 820, f4: 2100000 },
    fieldWeights: { f1: 30, f3: 20, f4: 20, f5: 30 },
    subUnitWeight: 40,
    createdBy: "ferry",
    createdAt: "2026-05-01",
    approvedBy: "budhi",
    approvedAt: "2026-05-03",
    closedAt: "2026-05-31",
    closingNote: "Omset 44jt di bawah target 55jt. Outlet belum punya PIC tetap — input oleh Leader. Stock loss tinggi perlu perhatian.",
  },
  // Xpanca Utama (xpc-main) - monthly, closed (score 86, margin 138jt/120jt over target)
  {
    id: "sub-010",
    templateId: "tpl-cabang-pulsa",
    subUnitId: "xpc-main",
    unitId: "xpanca",
    status: "closed",
    period: "Mei 2026",
    estimatedValues: { f1: 12000, f2: 120000000, f3: 9000000, f4: 200, f5: 170 },
    actualValues:    { f1: 13500, f2: 138000000, f3: 9500000, f4: 205, f5: 188 },
    fieldWeights: { f1: 25, f2: 25, f6: 20, f7: 10, f8: 20 },
    subUnitWeight: 100,
    createdBy: "fahrizal",
    createdAt: "2026-05-01",
    approvedBy: "budhi",
    approvedAt: "2026-05-02",
    closedAt: "2026-05-31",
    closingNote: "Margin 138jt melampaui target 120jt. Performa sangat baik, distribusi tumbuh pesat.",
  },
  // Kolam Ciwastra (aqua-ciwastra) - cycle, approved (siklus Apr-Jul masih berjalan, mg-005 estimated)
  {
    id: "sub-011",
    templateId: "tpl-kolam-pembesaran",
    subUnitId: "aqua-ciwastra",
    unitId: "aquaculture",
    status: "approved",
    period: "Siklus Apr-Jul 2026",
    estimatedValues: { f3: 15000, f4: 85, f5: 200, f6: 1.2, f7: 24000, f8: 180 },
    actualValues: null,
    fieldWeights: { f4: 25, f6: 25, f21: 25, f25: 25 },
    subUnitWeight: 30,
    createdBy: "satya",
    createdAt: "2026-04-10",
    approvedBy: "budhi",
    approvedAt: "2026-04-12",
    closedAt: null,
    closingNote: null,
  },
];

/**
 * Audit log — semua aksi penting tercatat di sini.
 * Untuk prototype, data dummy. Production: auto-generated dari semua mutation.
 *
 * @typedef {Object} AuditEntry
 * @property {string} id
 * @property {string} timestamp           - ISO datetime
 * @property {string} actorId             - User ID
 * @property {string} action              - "create"|"update"|"approve"|"reject"|"close"|"delete"
 * @property {string} entityType          - "kpi_submission"|"project"|"sub_unit"|"user"|"form_template"|"weight"
 * @property {string} entityId
 * @property {string} entityLabel         - Human-readable description
 * @property {string} unitId              - For filtering by unit (denormalized)
 * @property {string} [details]           - Optional detail text
 * @property {Object} [diff]              - {before, after} for update actions
 *
 * @type {AuditEntry[]}
 */
const AUDIT_LOG = [
  { id: "au-001", timestamp: "2026-05-31T16:45:00", actorId: "andi",     action: "close",    entityType: "kpi_submission", entityId: "sub-004", entityLabel: "Closing KPI Pixel BDG Pusat",            unitId: "pixel",       details: "Pertumbuhan transaksi naik 8% dari bulan lalu, didorong promo Lebaran." },
  { id: "au-002", timestamp: "2026-05-31T15:20:00", actorId: "budhi",    action: "approve",  entityType: "kpi_submission", entityId: "sub-004", entityLabel: "Approve closing Pixel BDG Pusat Mei",    unitId: "pixel" },
  { id: "au-003", timestamp: "2026-05-28T14:30:00", actorId: "rafli",    action: "close",    entityType: "kpi_submission", entityId: "sub-001", entityLabel: "Closing KPI Cerelek Siklus Feb-Mei",     unitId: "aquaculture", details: "Panen H+105. SR sedikit di bawah target karena suhu malam turun." },
  { id: "au-004", timestamp: "2026-05-28T15:00:00", actorId: "budhi",    action: "approve",  entityType: "kpi_submission", entityId: "sub-001", entityLabel: "Approve closing Cerelek Siklus Feb-Mei", unitId: "aquaculture" },
  { id: "au-005", timestamp: "2026-05-22T10:15:00", actorId: "wahyu",    action: "close",    entityType: "kpi_submission", entityId: "sub-003", entityLabel: "Closing KPI Cisampih Siklus Feb-Mei",    unitId: "aquaculture" },
  { id: "au-006", timestamp: "2026-05-20T09:30:00", actorId: "wahyu",    action: "create",   entityType: "kpi_submission", entityId: "sub-003", entityLabel: "Ajukan KPI Cisampih Siklus Mei-Agu",     unitId: "aquaculture", details: "Estimasi tebar 11.000 ekor, target SR 85%" },
  { id: "au-007", timestamp: "2026-05-17T11:20:00", actorId: "budhi",    action: "approve",  entityType: "kpi_submission", entityId: "sub-002", entityLabel: "Approve estimasi Cerelek Siklus Mei-Agu", unitId: "aquaculture", details: "Bobot SR dinaikkan dari 20% ke 25%" },
  { id: "au-008", timestamp: "2026-05-17T11:18:00", actorId: "budhi",    action: "update",   entityType: "weight",         entityId: "sub-002", entityLabel: "Update bobot KPI Cerelek Mei-Agu",       unitId: "aquaculture", diff: { before: "SR: 20%, FCR: 25%", after: "SR: 25%, FCR: 25%" } },
  { id: "au-009", timestamp: "2026-05-15T14:00:00", actorId: "rafli",    action: "create",   entityType: "kpi_submission", entityId: "sub-002", entityLabel: "Ajukan KPI Cerelek Siklus Mei-Agu",      unitId: "aquaculture" },
  { id: "au-010", timestamp: "2026-05-10T09:00:00", actorId: "budhi",    action: "create",   entityType: "sub_unit",       entityId: "rtl-outlet2", entityLabel: "Tambah Sub Unit: Outlet Setiabudi",  unitId: "retail" },
  { id: "au-011", timestamp: "2026-05-08T16:30:00", actorId: "budhi",    action: "update",   entityType: "user",           entityId: "bayu", entityLabel: "Assign Bayu sebagai PIC Outlet Dago",         unitId: "retail" },
  { id: "au-012", timestamp: "2026-05-05T10:00:00", actorId: "sugianto", action: "create",   entityType: "project",        entityId: "pj-202",  entityLabel: "Ajukan Project: Upgrade Sistem POS",      unitId: "pixel",       details: "Estimasi budget Rp 28Jt, target selesai Jun 2026" },
  { id: "au-013", timestamp: "2026-05-05T11:30:00", actorId: "budhi",    action: "approve",  entityType: "project",        entityId: "pj-202",  entityLabel: "Approve project: Upgrade Sistem POS",     unitId: "pixel" },
  { id: "au-014", timestamp: "2026-05-02T13:45:00", actorId: "budhi",    action: "approve",  entityType: "kpi_submission", entityId: "sub-004", entityLabel: "Approve estimasi Pixel BDG Pusat Mei",    unitId: "pixel" },
  { id: "au-015", timestamp: "2026-05-01T09:00:00", actorId: "andi",     action: "create",   entityType: "kpi_submission", entityId: "sub-004", entityLabel: "Ajukan KPI Pixel BDG Pusat Mei",          unitId: "pixel" },
  { id: "au-016", timestamp: "2026-04-30T17:00:00", actorId: "hendra",   action: "close",    entityType: "kpi_submission", entityId: "sub-h01", entityLabel: "Closing KPI Tanjung Blok A April",        unitId: "tanjung" },
  { id: "au-017", timestamp: "2026-04-15T10:20:00", actorId: "budhi",    action: "create",   entityType: "form_template",  entityId: "tpl-outlet-retail", entityLabel: "Buat template baru: Outlet Retail Bulanan", unitId: "retail" },
  { id: "au-018", timestamp: "2026-04-10T14:00:00", actorId: "satya",    action: "create",   entityType: "project",        entityId: "pj-001",  entityLabel: "Ajukan Project: Pembukaan Kolam Cerelek 2", unitId: "aquaculture" },
];


// ════════════════════════════════════════════════════════════════════════════
// §4  UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get all sub-units belonging to a unit.
 * @param {string} unitId
 * @returns {SubUnit[]}
 */
function getSubUnitsByUnit(unitId) {
  return LIVE.subUnits.filter(su => su.unitId === unitId);
}

/**
 * Get a user object by ID.
 * @param {string|null} userId
 * @returns {User|null}
 */
function getUser(userId) {
  return userId ? USERS[userId] || null : null;
}

// ──────────────────────────────────────────────────────────────────────────
// Period helpers
// ──────────────────────────────────────────────────────────────────────────

const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

/**
 * Available periods for the dashboard filter.
 * Returned in chronological order (oldest first).
 * @returns {Array<{ key: string, label: string, type: "month"|"ytd" }>}
 */
function getAvailablePeriods() {
  // For prototype, hardcode based on mock data range (Feb 2026 → May 2026)
  // In production, derive available periods from KPI_SUBMISSIONS closing dates.
  return [
    { key: "2026-02", label: "Feb 2026",       type: "month" },
    { key: "2026-03", label: "Mar 2026",       type: "month" },
    { key: "2026-04", label: "Apr 2026",       type: "month" },
    { key: "2026-05", label: "Mei 2026",       type: "month" },
    { key: "ytd-2026", label: "YTD 2026",      type: "ytd"   },
  ];
}

/**
 * Check if an ISO date falls within the given period filter.
 * @param {string|null} isoDate
 * @param {{ key: string, type: "month"|"ytd" }} period
 * @returns {boolean}
 */
function isDateInPeriod(isoDate, period) {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12

  if (period.type === "ytd") {
    const ytdYear = parseInt(period.key.split("-")[1], 10);
    return year === ytdYear;
  }

  // Month type: key is "YYYY-MM"
  const [pYear, pMonth] = period.key.split("-").map(n => parseInt(n, 10));
  return year === pYear && month === pMonth;
}

// ──────────────────────────────────────────────────────────────────────────
// KPI calculations (period-aware)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Get the KPI "snapshot" for a sub-unit within a period — now DERIVED from
 * KPI_SUBMISSIONS (single source of truth) rather than a separate table.
 *
 * A submission contributes to a period if it is CLOSED within that period.
 * Score is computed from the submission's fields (deriveScoreFromSubmission);
 * weight comes from the submission's subUnitWeight.
 *
 * @param {string} subUnitId
 * @param {{ key: string, type: string }} period
 * @returns {{ subUnitId, score, weight, closedAt, period, submissionId }|null}
 */
function getSubUnitSnapshotForPeriod(subUnitId, period) {
  // Closed submissions for this sub-unit that fall within the period
  const matches = LIVE.submissions.filter(s =>
    s.subUnitId === subUnitId &&
    s.status === "closed" &&
    s.closedAt &&
    isDateInPeriod(s.closedAt, period)
  );

  if (matches.length === 0) return null;

  const toSnapshot = (sub, scoreOverride) => ({
    subUnitId: sub.subUnitId,
    score: scoreOverride !== undefined ? scoreOverride : (deriveScoreFromSubmission(sub) ?? 0),
    weight: sub.subUnitWeight || 0,
    closedAt: sub.closedAt,
    period: sub.period,
    submissionId: sub.id,
  });

  // For YTD: average derived scores across all closings in the year
  if (period.type === "ytd") {
    const scores = matches.map(s => deriveScoreFromSubmission(s)).filter(v => v !== null);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const latest = matches.reduce((a, b) => new Date(a.closedAt) > new Date(b.closedAt) ? a : b);
    return toSnapshot(latest, avgScore);
  }

  // Single month: most recent closing in that month (usually only 1)
  const latest = matches.reduce((a, b) => new Date(a.closedAt) > new Date(b.closedAt) ? a : b);
  return toSnapshot(latest);
}

/**
 * Calculate the weighted average score for a unit within a period.
 * Only sub-units that CLOSED in this period contribute to the score.
 *
 * @param {string} unitId
 * @param {{ key: string, type: string }} period
 * @returns {{
 *   score: number,
 *   contributingCount: number,
 *   totalSubUnits: number,
 * }}
 */
function calculateUnitScoreForPeriod(unitId, period) {
  const subUnits = getSubUnitsByUnit(unitId);
  if (subUnits.length === 0) return { score: 0, contributingCount: 0, totalSubUnits: 0 };

  let totalWeight = 0;
  let weightedSum = 0;
  let contributingCount = 0;

  for (const su of subUnits) {
    const snapshot = getSubUnitSnapshotForPeriod(su.id, period);
    if (!snapshot) continue;
    weightedSum += snapshot.score * snapshot.weight;
    totalWeight += snapshot.weight;
    contributingCount++;
  }

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  return { score, contributingCount, totalSubUnits: subUnits.length };
}

/**
 * Determine status based on score.
 * @param {number} score
 * @returns {{ label: string, color: string, bg: string }}
 */
function getScoreStatus(score) {
  if (score === 0) return { label: "Belum Mulai", color: COLORS.textLight, bg: COLORS.bgMuted };
  if (score >= STATUS_THRESHOLDS.onTrack) return { label: "On Track", color: COLORS.success, bg: COLORS.successBg };
  if (score >= STATUS_THRESHOLDS.attention) return { label: "Perlu Perhatian", color: COLORS.warning, bg: COLORS.warningBg };
  return { label: "Tertinggal", color: COLORS.danger, bg: COLORS.dangerBg };
}

// ──────────────────────────────────────────────────────────────────────────
// Formatters
// ──────────────────────────────────────────────────────────────────────────

/**
 * Format ISO date to Indonesian-localized short date.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  const d = new Date(isoDate);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format Rupiah amount in compact Indonesian form (Rp 1,2 M, Rp 350 Jt, Rp 5 Rb).
 * @param {number} amount
 * @returns {string}
 */
function formatRupiah(amount) {
  // Full format with thousand separators (e.g. Rp 1.000.000) — no Jt/Rb/M
  // abbreviation, so figures are always exact across the whole app.
  const num = Math.round(Number(amount) || 0);
  return `Rp ${num.toLocaleString("id-ID")}`;
}

// ──────────────────────────────────────────────────────────────────────────
// Margin calculations (period-aware)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Get margin entries for a unit, filtered by period.
 * Entries are matched by their closedAt date.
 *
 * @param {string} unitId
 * @returns {MarginEntry[]}
 */
function getMarginEntriesByUnit(unitId) {
  return getDerivedMarginEntries().filter(m => m.unitId === unitId);
}

/**
 * Calculate aggregated margin for a unit within a period.
 *
 * Rules:
 *   - "Closed in this period": entries where status=closed AND closedAt is in period
 *     → counted in target & actual
 *   - "Pending": entries that haven't closed yet (any expectedCloseAt)
 *     → shown as informational pending, not counted in main total
 *
 * @param {string} unitId
 * @param {{ key: string, type: string }} period
 * @returns {{
 *   target: number,
 *   actual: number,
 *   percentage: number,
 *   closedCount: number,
 *   closedEntries: MarginEntry[],
 *   pendingEntries: MarginEntry[],
 *   pendingTotal: number,
 * }}
 */
function calculateUnitMarginForPeriod(unitId, period) {
  const entries = getMarginEntriesByUnit(unitId);

  let target = 0;
  let actual = 0;
  let closedCount = 0;
  let pendingTotal = 0;
  const closedEntries = [];
  const pendingEntries = [];

  for (const entry of entries) {
    if (entry.status === "closed" && isDateInPeriod(entry.closedAt, period)) {
      // Closed in this period: count it
      target += entry.targetMargin;
      actual += entry.actualMargin;
      closedCount++;
      closedEntries.push(entry);
    } else if (entry.status === "approved" || entry.status === "estimated") {
      // Not closed yet — pending
      pendingTotal += entry.targetMargin;
      pendingEntries.push(entry);
    }
    // "closed" but not in this period → ignore (belongs to another period)
  }

  const percentage = target > 0 ? Math.round((actual / target) * 100) : 0;

  return {
    target,
    actual,
    percentage,
    closedCount,
    closedEntries,
    pendingEntries,
    pendingTotal,
  };
}

/**
 * Grand total margin across all units for a period.
 * @param {{ key: string, type: string }} period
 * @returns {{ target: number, actual: number, percentage: number, pendingTotal: number }}
 */
function calculateGrandTotalMarginForPeriod(period) {
  let target = 0;
  let actual = 0;
  let pendingTotal = 0;

  for (const entry of getDerivedMarginEntries()) {
    if (entry.status === "closed" && isDateInPeriod(entry.closedAt, period)) {
      target += entry.targetMargin;
      actual += entry.actualMargin;
    } else if (entry.status === "approved" || entry.status === "estimated") {
      pendingTotal += entry.targetMargin;
    }
  }

  const percentage = target > 0 ? Math.round((actual / target) * 100) : 0;
  return { target, actual, percentage, pendingTotal };
}

// ──────────────────────────────────────────────────────────────────────────
// Project calculations
// ──────────────────────────────────────────────────────────────────────────

/**
 * Get all projects for a unit.
 * Projects are active across periods; for now we don't filter by period (they're shown as current snapshot).
 *
 * @param {string} unitId
 * @returns {Project[]}
 */
function getProjectsByUnit(unitId) {
  return LIVE.projects.filter(p => p.unitId === unitId);
}

/**
 * Aggregate budget across ALL projects.
 * - Kebutuhan (rencana): based on milestone TARGET DATE (when funds are planned)
 * - Realisasi: based on EXPENSE DATE (when funds actually went out) — may differ from plan
 *
 * @param {{ key: string, type: "month"|"ytd" }} period
 */
function calculateBudgetSummary(period) {
  let needThisMonth = 0;
  let needAllPeriod = 0;
  let realisasiThisMonth = 0;
  let realisasiAllPeriod = 0;

  LIVE.projects.forEach(p => {
    // Kebutuhan from milestone target dates
    const milestones = LIVE.milestones[p.id];
    if (milestones && milestones.length > 0) {
      milestones.forEach(m => {
        const alloc = Number(m.budgetAllocated) || 0;
        needAllPeriod += alloc;
        if (isDateInPeriod(m.date, period)) needThisMonth += alloc;
      });
    } else {
      needAllPeriod += Number(p.budgetPlanned) || 0;
    }

    // Realisasi from expense (payment) dates
    const expenses = LIVE.expenses[p.id];
    if (expenses && expenses.length > 0) {
      expenses.forEach(ex => {
        const amt = Number(ex.amount) || 0;
        realisasiAllPeriod += amt;
        if (isDateInPeriod(ex.date, period)) realisasiThisMonth += amt;
      });
    } else {
      realisasiAllPeriod += Number(p.budgetSpent) || 0;
    }
  });

  return {
    needThisMonth,
    realisasiThisMonth,
    sisaThisMonth: needThisMonth - realisasiThisMonth,
    needAllPeriod,
    realisasiAllPeriod,
    sisaAllPeriod: needAllPeriod - realisasiAllPeriod,
  };
}

/**
 * Calculate work & budget progress metrics for a project.
 * @param {Project} project
 * @returns {{ workProgress: number, budgetProgress: number }}
 */
function calculateProjectProgress(project) {
  const workProgress = project.milestonesTotal > 0
    ? Math.round((project.milestonesDone / project.milestonesTotal) * 100)
    : 0;

  const budgetProgress = project.budgetPlanned > 0
    ? Math.round((project.budgetSpent / project.budgetPlanned) * 100)
    : 0;

  return { workProgress, budgetProgress };
}

/**
 * Map project status to UI label & color.
 * @param {string} status
 * @returns {{ label: string, color: string, bg: string }}
 */
function getProjectStatusInfo(status) {
  switch (status) {
    case "on_track": return { label: "On Track",   color: COLORS.success,   bg: COLORS.successBg };
    case "at_risk":  return { label: "Perhatian",  color: COLORS.warning,   bg: COLORS.warningBg };
    case "behind":   return { label: "Tertinggal", color: COLORS.danger,    bg: COLORS.dangerBg };
    case "done":     return { label: "Selesai",    color: COLORS.primary,   bg: COLORS.infoBg };
    default:         return { label: status,       color: COLORS.textMuted, bg: COLORS.bgMuted };
  }
}

/**
 * Look up sub-unit name by ID.
 * @param {string|null} subUnitId
 * @returns {string|null}
 */
function getSubUnitName(subUnitId) {
  if (!subUnitId) return null;
  const su = LIVE.subUnits.find(s => s.id === subUnitId);
  return su ? su.name : null;
}

// ──────────────────────────────────────────────────────────────────────────
// Form Template & Submission helpers
// ──────────────────────────────────────────────────────────────────────────

/**
 * Look up a form template by ID.
 * @param {string} templateId
 * @returns {FormTemplate|null}
 */
function getFormTemplate(templateId) {
  return LIVE.templates.find(t => t.id === templateId) || null;
}

/**
 * Look up a formula by ID.
 * @param {string} formulaId
 * @returns {Object|null}
 */
function getFormula(formulaId) {
  return FORMULA_LIBRARY.find(f => f.id === formulaId) || null;
}

/**
 * Compute auto-calculated field values based on manual inputs.
 * Returns merged object with both manual + computed values, keyed by field name.
 *
 * @param {FormTemplate} template
 * @param {Object} valuesByFieldId - { fieldId: number/string }
 * @returns {Object} valuesByFieldName + computed
 */
function computeFieldValues(template, valuesByFieldId) {
  // First: build values keyed by field name
  const byName = {};
  for (const field of template.fields) {
    if (field.type !== "auto") {
      byName[field.name] = valuesByFieldId[field.id] !== undefined
        ? Number(valuesByFieldId[field.id]) || valuesByFieldId[field.id]
        : 0;
    }
  }

  // Then: compute auto fields in order (handle dependencies)
  // Run multiple passes so formulas that depend on other computed formulas
  // resolve correctly regardless of field ordering. Deepest chain (Pembesaran):
  // Kg Tebar → Populasi → Panen → Berat Panen → Pakan → HPP Pakan → Total Biaya → Margin
  // = 7 levels, so 8 passes give a safe margin.
  //
  // Two formula sources are supported:
  //   - formulaId   : legacy templates referencing FORMULA_LIBRARY (formula.compute)
  //   - formulaExpr : user-built templates store the expression string on the field;
  //                   evaluated by name via evalFormula (so no library entry needed).
  for (let pass = 0; pass < 8; pass++) {
    for (const field of template.fields) {
      if (field.type !== "auto") continue;
      if (field.formulaId) {
        const formula = getFormula(field.formulaId);
        if (!formula) continue;
        try {
          byName[field.name] = formula.compute(byName);
        } catch (e) {
          byName[field.name] = 0;
        }
      } else if (field.formulaExpr) {
        const r = evalFormula(field.formulaExpr, byName);
        byName[field.name] = r.ok ? r.value : 0;
      }
    }
  }

  return byName;
}

// ════════════════════════════════════════════════════════════════════════════
// SCORING ENGINE — Single Source of Truth
// ────────────────────────────────────────────────────────────────────────────
// KPI_SUBMISSIONS is the authoritative data source. A sub-unit's score and
// margin are DERIVED from its submission here — not stored separately.
//
// How scoring works:
//   1. Each weighted field has a "direction" (see getFieldDirection):
//        - higher_better : achievement = actual / target × 100   (Omset, Margin, SR, Panen…)
//        - lower_better  : achievement = target / actual × 100   (Biaya, HPP, FCR, Stock Loss…)
//   2. Field achievement may exceed 100% (over-achievers are rewarded — by design).
//   3. Sub-unit score = Σ(achievement × fieldWeight) / Σ(fieldWeight).
//
// This replaces the old separate KPI_SNAPSHOTS / MARGIN_ENTRIES tables.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Determine the scoring direction of a field from its semantics.
 * Centralized here (by name) so templates stay clean and the rule is in one place.
 *
 * @param {{ name: string }} field
 * @returns {"higher_better" | "lower_better"}
 */
function getFieldDirection(field) {
  const name = (field.name || "").toLowerCase();
  // Lower-is-better: costs, cost-of-goods, feed-conversion, losses
  const lowerBetterKeywords = ["biaya", "hpp", "fcr", "stock loss", "loss", "kerugian"];
  if (lowerBetterKeywords.some(k => name.includes(k))) return "lower_better";
  // Everything else (omset, margin, sr, panen, transaksi, agen, pelanggan…) higher is better
  return "higher_better";
}

/**
 * Compute one field's achievement % comparing actual vs target (estimated).
 * Over-achievement is allowed (can exceed 100). Returns 0 when not computable.
 *
 * @param {{ name: string }} field
 * @param {number} target  estimated/target value
 * @param {number} actual  realized value
 * @returns {number} achievement percentage
 */
function computeFieldAchievement(field, target, actual) {
  const dir = getFieldDirection(field);
  const t = Number(target) || 0;
  const a = Number(actual) || 0;
  if (dir === "lower_better") {
    if (a <= 0) return 0;
    return (t / a) * 100;
  }
  // higher_better
  if (t <= 0) return 0;
  return (a / t) * 100;
}

/**
 * Derive a sub-unit's KPI score from a submission.
 * Uses actualValues vs estimatedValues across weighted fields.
 * For not-yet-closed submissions (actualValues null) returns null (no score yet).
 *
 * @param {Object} submission
 * @returns {number|null} weighted score, or null if not scorable yet
 */
function deriveScoreFromSubmission(submission) {
  if (!submission) return null;
  if (!submission.actualValues) return null; // still running, not closed
  const template = getFormTemplate(submission.templateId);
  if (!template) return null;

  // Compute full value sets (manual + auto formula fields) for target and actual
  const targetVals = computeFieldValues(template, submission.estimatedValues || {});
  const actualVals = computeFieldValues(template, submission.actualValues || {});

  const weights = submission.fieldWeights || {};
  let weightedSum = 0;
  let totalWeight = 0;

  for (const fieldId of Object.keys(weights)) {
    const weight = Number(weights[fieldId]) || 0;
    if (weight <= 0) continue;
    const field = template.fields.find(f => f.id === fieldId);
    if (!field) continue;
    const target = targetVals[field.name];
    const actual = actualVals[field.name];
    const achievement = computeFieldAchievement(field, target, actual);
    weightedSum += achievement * weight;
    totalWeight += weight;
  }

  if (totalWeight <= 0) return null;
  return Math.round(weightedSum / totalWeight);
}

/**
 * Derive margin (target & actual) from a submission's margin field (isMargin: true).
 *
 * @param {Object} submission
 * @returns {{ target: number, actual: number, hasMargin: boolean }}
 */
function deriveMarginFromSubmission(submission) {
  if (!submission) return { target: 0, actual: 0, hasMargin: false };
  const template = getFormTemplate(submission.templateId);
  if (!template) return { target: 0, actual: 0, hasMargin: false };

  const marginField = template.fields.find(f => f.isMargin);
  if (!marginField) return { target: 0, actual: 0, hasMargin: false };

  const targetVals = computeFieldValues(template, submission.estimatedValues || {});
  const target = Number(targetVals[marginField.name]) || 0;

  let actual = 0;
  if (submission.actualValues) {
    const actualVals = computeFieldValues(template, submission.actualValues);
    actual = Number(actualVals[marginField.name]) || 0;
  }

  return { target, actual, hasMargin: target > 0 || actual > 0 };
}

/**
 * Build margin "entries" derived from KPI_SUBMISSIONS — replacing the old
 * MARGIN_ENTRIES table. Each entry mirrors the legacy shape so downstream
 * margin calculations stay unchanged.
 *
 * @returns {Array<{ subUnitId, unitId, status, targetMargin, actualMargin, period, closedAt }>}
 */
function getDerivedMarginEntries() {
  return LIVE.submissions.map(sub => {
    const m = deriveMarginFromSubmission(sub);
    return {
      submissionId: sub.id,
      subUnitId: sub.subUnitId,
      unitId: sub.unitId,
      status: sub.status,
      targetMargin: m.target,
      actualMargin: sub.status === "closed" ? m.actual : 0,
      period: sub.period,
      closedAt: sub.closedAt,
    };
  }).filter(e => e.targetMargin > 0 || e.actualMargin > 0);
}

/**
 * Get all submissions matching filters.
 * @param {Object} [filters]
 * @returns {KPISubmission[]}
 */
function getSubmissions(filters = {}) {
  return LIVE.submissions.filter(s => {
    if (filters.status && s.status !== filters.status) return false;
    if (filters.subUnitId && s.subUnitId !== filters.subUnitId) return false;
    if (filters.unitId && s.unitId !== filters.unitId) return false;
    if (filters.createdBy && s.createdBy !== filters.createdBy) return false;
    return true;
  });
}

/**
 * Format Rupiah in full with thousand separators (Rp 45.000.000).
 * Used in forms where precise amounts matter, unlike the compact formatRupiah.
 * @param {number} amount
 * @returns {string}
 */
function formatRupiahFull(amount) {
  const num = Math.round(Number(amount) || 0);
  return `Rp ${num.toLocaleString("id-ID")}`;
}

/**
 * Safe arithmetic formula evaluator (no eval).
 * Supports + - * / ( ) and variable substitution from `vars` map.
 * Variable names in the expression are matched against keys of `vars` (case-insensitive,
 * longest-name-first to handle names containing spaces / shared prefixes).
 *
 * Returns { ok: true, value } or { ok: false, error }.
 */
function evalFormula(expr, vars) {
  if (!expr || !expr.trim()) return { ok: false, error: "Rumus kosong" };

  // 1. Substitute variable names with their numeric values.
  // Sort names by length desc so longer names match before shorter substrings.
  let work = expr;
  const names = Object.keys(vars).sort((a, b) => b.length - a.length);
  for (const nm of names) {
    if (!nm.trim()) continue;
    const val = Number(vars[nm]);
    const safeVal = isNaN(val) ? 0 : val;
    // Escape regex special chars in the name
    const escaped = nm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match the name as a whole token (not part of a larger word)
    const re = new RegExp(`(^|[^A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`, "gi");
    work = work.replace(re, (m, pre) => `${pre}(${safeVal})`);
  }

  // 2. After substitution, only digits, operators, parens, dot, spaces allowed.
  if (/[A-Za-z_]/.test(work)) {
    // Find the leftover token for a helpful error
    const leftover = (work.match(/[A-Za-z_][A-Za-z0-9_ ]*/) || ["?"])[0].trim();
    return { ok: false, error: `Nama tidak dikenal: "${leftover}"` };
  }
  if (/[^0-9+\-*/().\s]/.test(work)) {
    return { ok: false, error: "Ada karakter tidak valid dalam rumus" };
  }

  // 3. Tokenize.
  const tokens = work.match(/\d+\.?\d*|[+\-*/()]/g);
  if (!tokens) return { ok: false, error: "Rumus tidak valid" };

  // 4. Shunting-yard → RPN.
  const prec = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const out = [];
  const ops = [];
  let prevType = null; // "num" | "op" | "(" | ")"
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^\d/.test(t)) {
      out.push(parseFloat(t));
      prevType = "num";
    } else if (t === "(") {
      ops.push(t);
      prevType = "(";
    } else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop());
      if (!ops.length) return { ok: false, error: "Kurung tidak seimbang" };
      ops.pop();
      prevType = ")";
    } else {
      // Operator. Handle unary minus/plus.
      let op = t;
      if ((op === "-" || op === "+") && (prevType === null || prevType === "op" || prevType === "(")) {
        // Unary: convert to (0 op x) by pushing 0 first
        out.push(0);
      }
      while (
        ops.length &&
        ops[ops.length - 1] !== "(" &&
        prec[ops[ops.length - 1]] >= prec[op]
      ) {
        out.push(ops.pop());
      }
      ops.push(op);
      prevType = "op";
    }
  }
  while (ops.length) {
    const o = ops.pop();
    if (o === "(") return { ok: false, error: "Kurung tidak seimbang" };
    out.push(o);
  }

  // 5. Evaluate RPN.
  const stack = [];
  for (const tok of out) {
    if (typeof tok === "number") {
      stack.push(tok);
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return { ok: false, error: "Rumus tidak lengkap" };
      let r;
      if (tok === "+") r = a + b;
      else if (tok === "-") r = a - b;
      else if (tok === "*") r = a * b;
      else if (tok === "/") r = b === 0 ? 0 : a / b;
      stack.push(r);
    }
  }
  if (stack.length !== 1) return { ok: false, error: "Rumus tidak lengkap" };
  return { ok: true, value: stack[0] };
}

/**
 * Format a field value with its unit (for display).
 * @param {number|string} value
 * @param {string} satuan
 * @param {string} type
 */
function formatFieldValue(value, satuan, type) {
  if (value === undefined || value === null || value === "") return "—";
  if (type === "date") return value;
  if (type === "text") return value;

  const num = Number(value);
  if (isNaN(num)) return String(value);

  if (satuan === "Rp") return formatRupiahFull(num);
  if (satuan === "Rp/kg") return `${formatRupiahFull(num)} /kg`;
  if (satuan === "%" || satuan === "x") {
    return `${num.toFixed(satuan === "x" ? 2 : 1)} ${satuan}`;
  }
  // ekor, kg, etc → integer with thousand separator
  return `${num.toLocaleString("id-ID")} ${satuan}`.trim();
}

// ──────────────────────────────────────────────────────────────────────────
// Role-based data filtering
// ──────────────────────────────────────────────────────────────────────────

/**
 * Filter projects based on user role (data visibility).
 * @param {User} user
 * @returns {Project[]}
 */
function getProjectsForUser(user) {
  if (!user) return [];
  switch (user.role) {
    case ROLES.OWNER:
    case ROLES.FINANCE:
    case ROLES.HR:
      return LIVE.projects;
    case ROLES.LEADER:
      return LIVE.projects.filter(p => p.unitId === user.unitId);
    case ROLES.PIC:
      return LIVE.projects.filter(p =>
        p.subUnitId === user.subUnitId ||
        (p.unitId === user.unitId && p.subUnitId === null)
      );
    default:
      return [];
  }
}

/**
 * Filter KPI submissions based on user role.
 * @param {User} user
 * @returns {KPISubmission[]}
 */
function getSubmissionsForUser(user) {
  if (!user) return [];
  switch (user.role) {
    case ROLES.OWNER:
    case ROLES.FINANCE:
    case ROLES.HR:
      return LIVE.submissions;
    case ROLES.LEADER:
      return LIVE.submissions.filter(s => s.unitId === user.unitId);
    case ROLES.PIC:
      return LIVE.submissions.filter(s => s.subUnitId === user.subUnitId);
    default:
      return [];
  }
}

/**
 * Filter audit log based on user role.
 * @param {User} user
 * @returns {AuditEntry[]}
 */
function getAuditLogForUser(user) {
  if (!user) return [];
  switch (user.role) {
    case ROLES.OWNER:
      return AUDIT_LOG;
    case ROLES.LEADER:
      return AUDIT_LOG.filter(a => a.unitId === user.unitId);
    case ROLES.PIC:
      return AUDIT_LOG.filter(a => {
        // PIC sees entries related to their sub-unit OR their own actions
        const sub = LIVE.subUnits.find(su => su.id === user.subUnitId);
        return a.actorId === user.id ||
               (sub && (a.entityId === sub.id || a.entityId === user.id));
      });
    default:
      return [];
  }
}

/**
 * Get pending approval items count for the user (for inbox badge).
 * @param {User} user
 * @returns {number}
 */
function getInboxCount(user) {
  if (!user) return 0;
  if (user.role === ROLES.OWNER) {
    return getSubmissions({ status: "estimated" }).length;
  }
  if (user.role === ROLES.LEADER) {
    return LIVE.submissions.filter(s =>
      s.unitId === user.unitId && s.status === "approved"
    ).length;
  }
  if (user.role === ROLES.PIC) {
    return LIVE.submissions.filter(s =>
      s.subUnitId === user.subUnitId && (s.status === "approved" || s.status === "estimated")
    ).length;
  }
  return 0;
}

/**
 * Format ISO datetime to compact Indonesian datetime.
 * @param {string} isoDt
 */
function formatDateTime(isoDt) {
  const d = new Date(isoDt);
  const date = formatDate(isoDt);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${date}, ${time}`;
}

/**
 * Get audit action display info.
 * @param {string} action
 */
function getAuditActionInfo(action) {
  switch (action) {
    case "create":  return { label: "Buat",    icon: "plus",        color: COLORS.primary,   bg: COLORS.infoBg };
    case "update":  return { label: "Ubah",    icon: "edit",        color: COLORS.warning,   bg: COLORS.warningBg };
    case "approve": return { label: "Approve", icon: "check",       color: COLORS.success,   bg: COLORS.successBg };
    case "reject":  return { label: "Reject",  icon: "x",           color: COLORS.danger,    bg: COLORS.dangerBg };
    case "close":   return { label: "Closing", icon: "lock",        color: COLORS.secondary, bg: COLORS.goldLight };
    case "delete":  return { label: "Hapus",   icon: "trash",       color: COLORS.danger,    bg: COLORS.dangerBg };
    default:        return { label: action,    icon: "info",        color: COLORS.textMuted, bg: COLORS.bgMuted };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Backward-compatibility shims
// These are used by pages that haven't been refactored to accept a period
// (e.g. UnitDetailPage, LeaderWorkspace, PICWorkspace).
// They default to the current month (Mei 2026 in this prototype).
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_PERIOD = { key: "2026-05", label: "Mei 2026", type: "month" };

/**
 * Get the KPI snapshot for a sub-unit (current period default).
 * @param {string} subUnitId
 * @returns {KPISnapshot|null}
 */
function getSubUnitSnapshot(subUnitId) {
  return getSubUnitSnapshotForPeriod(subUnitId, DEFAULT_PERIOD);
}

/**
 * Resolve the KPI score & margin for a specific submission — derived directly
 * from the submission itself (single source of truth).
 *
 * @param {Object} submission
 * @returns {{ score: number|null, weight: number|null, marginTarget: number, marginActual: number, hasMargin: boolean }}
 */
function getSubmissionPerformance(submission) {
  if (!submission) return { score: null, weight: null, marginTarget: 0, marginActual: 0, hasMargin: false };

  const score = deriveScoreFromSubmission(submission); // null if not yet closed
  const margin = deriveMarginFromSubmission(submission);

  return {
    score,
    weight: submission.subUnitWeight || null,
    marginTarget: margin.target,
    marginActual: submission.status === "closed" ? margin.actual : 0,
    hasMargin: margin.hasMargin,
  };
}

/**
 * Calculate unit score (current period default).
 * @param {string} unitId
 * @returns {number}
 */
function calculateUnitScore(unitId) {
  return calculateUnitScoreForPeriod(unitId, DEFAULT_PERIOD).score;
}

/**
 * Calculate unit margin (current period default).
 * @param {string} unitId
 */
function calculateUnitMargin(unitId) {
  const r = calculateUnitMarginForPeriod(unitId, DEFAULT_PERIOD);
  return {
    target: r.target,
    actual: r.actual,
    pending: r.pendingTotal,
    percentage: r.percentage,
    closedCount: r.closedCount,
    pendingCount: r.pendingEntries.length,
  };
}

/**
 * Calculate grand total margin (current period default).
 */
function calculateGrandTotalMargin() {
  const r = calculateGrandTotalMarginForPeriod(DEFAULT_PERIOD);
  return {
    target: r.target,
    actual: r.actual,
    pending: r.pendingTotal,
    percentage: r.percentage,
  };
}


// ════════════════════════════════════════════════════════════════════════════
// §5  UI PRIMITIVES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Icon — minimalist line icons (SVG), replacing emoji throughout the app.
 * Stroke-based, inherits color via currentColor. Usage: <Icon name="dashboard" size={18} />
 */
function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.6, style }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>,
    project: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>,
    margin: <><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    kpi: <><line x1="3" y1="21" x2="21" y2="21"/><rect x="5" y="11" width="3" height="7"/><rect x="10.5" y="7" width="3" height="11"/><rect x="16" y="13" width="3" height="5"/></>,
    inbox: <><path d="M3 12h5l2 3h4l2-3h5"/><path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/></>,
    audit: <><path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    admin: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    workspace: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><line x1="9" y1="6" x2="9" y2="6"/><line x1="15" y1="6" x2="15" y2="6"/><line x1="9" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="15" y2="10"/></>,
    chart: <><line x1="3" y1="21" x2="21" y2="21"/><polyline points="4 14 9 9 13 13 20 6"/></>,
    money: <><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    checkCircle: <><circle cx="12" cy="12" r="9"/><polyline points="16 9 11 14.5 8 11.5"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></>,
    play: <><polygon points="6 4 20 12 6 20 6 4"/></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></>,
    fish: <><path d="M6.5 12c2-4 6-6 11-6 0 0-1 3-1 6s1 6 1 6c-5 0-9-2-11-6z"/><path d="M6.5 12C5 12 3 13 2 15c2 0 3-1 4.5-3z"/><circle cx="15" cy="10" r="0.6"/></>,
    cog: <><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19"/></>,
    store: <><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M3 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0"/></>,
    signal: <><path d="M5 12.55a8 8 0 0 1 14 0"/><path d="M8.5 16.5a4 4 0 0 1 7 0"/><line x1="12" y1="20" x2="12" y2="20"/></>,
    water: <><path d="M12 2.5S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5z"/></>,
    bot: <><rect x="4" y="8" width="16" height="12" rx="2"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><line x1="12" y1="4" x2="12" y2="8"/><circle cx="12" cy="3" r="1"/></>,
    info: <><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12" y2="8"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    warning: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3" y2="6"/><line x1="3" y1="12" x2="3" y2="12"/><line x1="3" y1="18" x2="3" y2="18"/></>,
  };

  const path = paths[name] || paths.info;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      {path}
    </svg>
  );
}

function Pill({ children, color, bg }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 9px",
      borderRadius: 99,
      background: bg,
      color: color,
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.4,
    }}>
      {children}
    </span>
  );
}

function Card({ children, style, onClick, hover }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: COLORS.white,
        borderRadius: 14,
        border: `1px solid ${COLORS.border}`,
        boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.05)",
        transition: "all 0.2s",
        cursor: onClick ? "pointer" : "default",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ProgressBar({ value, color, height = 6 }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div style={{
      height,
      background: COLORS.bgMuted,
      borderRadius: 99,
      overflow: "hidden",
    }}>
      <div style={{
        height: "100%",
        width: `${clamped}%`,
        background: color,
        borderRadius: 99,
        transition: "width 0.6s ease",
      }} />
    </div>
  );
}

function Button({ children, variant = "primary", onClick, disabled, size = "md", fullWidth }) {
  const VARIANTS = {
    primary:   { bg: COLORS.primary, color: COLORS.white, border: "none" },
    secondary: { bg: COLORS.white, color: COLORS.text, border: `1px solid ${COLORS.border}` },
    success:   { bg: COLORS.success, color: COLORS.white, border: "none" },
    danger:    { bg: COLORS.white, color: COLORS.danger, border: `1px solid ${COLORS.danger}` },
    ghost:     { bg: "transparent", color: COLORS.textMuted, border: "none" },
  };

  const SIZES = {
    sm: { padding: "5px 10px", fontSize: 11 },
    md: { padding: "8px 14px", fontSize: 12 },
    lg: { padding: "10px 18px", fontSize: 13 },
  };

  const v = VARIANTS[variant];
  const s = SIZES[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v,
        ...s,
        borderRadius: 8,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? "100%" : "auto",
        transition: "opacity 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      gap: 10,
    }}>
      <div>
        <h2 style={{ margin: 0, fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700, color: COLORS.dark, letterSpacing: -0.3 }}>{title}</h2>
        {subtitle && <p style={{ margin: "3px 0 0", fontSize: 11, color: COLORS.textMuted }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function InfoBanner({ icon, title, children, variant = "info" }) {
  const VARIANTS = {
    info:    { bg: COLORS.infoBg,    border: "#C5DBF0", color: COLORS.primaryDark },
    warning: { bg: COLORS.warningBg, border: "#EBD9B4", color: "#8A6420" },
    success: { bg: COLORS.successBg, border: "#CDE3C2", color: "#3F6E31" },
  };
  const v = VARIANTS[variant];
  const iconName = icon || "info";

  return (
    <div style={{
      padding: "12px 14px",
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: 10,
      color: v.color,
    }}>
      {title && (
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 7 }}>
          <Icon name={iconName} size={15} color={v.color} /> {title}
        </div>
      )}
      <div style={{ fontSize: 11, lineHeight: 1.5, display: "flex", gap: 8 }}>
        {!title && <Icon name={iconName} size={15} color={v.color} style={{ marginTop: 1 }} />}
        <div>{children}</div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// §6  AUTH LAYER
// ════════════════════════════════════════════════════════════════════════════

/**
 * Login screen with role-grouped user selection.
 */
function LoginScreen({ onAuthenticate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const groupedUsers = useMemo(() => {
    const groups = { owners: [], support: [], leaders: [], pics: [] };
    Object.values(USERS).forEach(u => {
      if (u.role === ROLES.OWNER) groups.owners.push(u);
      else if (u.role === ROLES.FINANCE || u.role === ROLES.HR) groups.support.push(u);
      else if (u.role === ROLES.LEADER) groups.leaders.push(u);
      else if (u.role === ROLES.PIC) groups.pics.push(u);
    });
    return groups;
  }, []);

  // Submit kredensial ke API (dipakai form manual maupun tombol demo).
  const submit = async (em, pw) => {
    setError("");
    setLoading(true);
    try {
      await onAuthenticate(em.trim(), pw);
    } catch (err) {
      setError(err.message || "Login gagal.");
      setLoading(false);
    }
  };

  // Tombol demo: isi email user + password pola "<id>123", lalu submit.
  const loginDemo = (user) => {
    setEmail(user.email);
    setPassword(`${user.id}123`);
    submit(user.email, `${user.id}123`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: `linear-gradient(135deg, ${COLORS.dark}, #1E1B4B)`,
      padding: 16,
    }}>
      <div style={{
        maxWidth: 460,
        width: "100%",
        background: COLORS.white,
        borderRadius: 20,
        padding: "28px 24px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 16,
          margin: "0 auto 16px",
          background: COLORS.darker,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          <img src={GDN_LOGO} alt="GDN" style={{ height: 58, width: "auto", display: "block" }} />
        </div>
        <h1 style={{ fontFamily: FONTS.heading, textAlign: "center", margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: COLORS.dark }}>
          {APP_CONFIG.name}
        </h1>
        <p style={{ textAlign: "center", margin: "6px 0 18px", fontSize: 12, color: COLORS.textMuted }}>
          Sistem Planning & Monitoring Bisnis
        </p>

        <div style={{
          background: COLORS.warningBg,
          border: `1px solid #FDE68A`,
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 18,
          fontSize: 11,
          color: "#92400E",
        }}><strong>Demo v{APP_CONFIG.version}</strong> — Masuk dengan email & password, atau klik akun demo
        </div>

        {/* Form login email + password (autentikasi sungguhan ke backend) */}
        <form
          onSubmit={(e) => { e.preventDefault(); submit(email, password); }}
          style={{ display: "grid", gap: 10, marginBottom: 16 }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="username"
            style={{
              padding: "11px 12px", borderRadius: 10, fontSize: 14,
              border: `1px solid ${COLORS.border}`, outline: "none", fontFamily: FONTS.body,
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            style={{
              padding: "11px 12px", borderRadius: 10, fontSize: 14,
              border: `1px solid ${COLORS.border}`, outline: "none", fontFamily: FONTS.body,
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: COLORS.danger, background: COLORS.dangerBg, padding: "8px 10px", borderRadius: 8 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              padding: "11px 12px", borderRadius: 10, fontSize: 14, fontWeight: 700,
              color: COLORS.white, background: COLORS.primary, border: "none",
              cursor: loading ? "wait" : "pointer", opacity: (loading || !email || !password) ? 0.6 : 1,
              fontFamily: FONTS.body,
            }}
          >
            {loading ? "Memproses…" : "Masuk"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: 10, color: COLORS.textLight, textTransform: "uppercase", letterSpacing: 0.6, margin: "4px 0 12px" }}>
          atau pilih akun demo
        </div>

        <LoginUserGroup label="Owner" users={groupedUsers.owners} onSelect={loginDemo} />
        <LoginUserGroup label="Support (Finance & HR)" users={groupedUsers.support} onSelect={loginDemo} />
        <LoginUserGroup label="Leader Unit" users={groupedUsers.leaders} onSelect={loginDemo} />
        <LoginUserGroup label="PIC Sub Unit (Baru di v2)" users={groupedUsers.pics} onSelect={loginDemo} highlight />

        <div style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: `1px solid ${COLORS.bgMuted}`,
          textAlign: "center",
          fontSize: 10,
          color: COLORS.textLight,
        }}>Production: Login via Google OAuth
        </div>
      </div>
    </div>
  );
}

function LoginUserGroup({ label, users, onSelect, highlight }) {
  if (users.length === 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: highlight ? COLORS.primary : COLORS.textLight,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        marginBottom: 6,
      }}>{label}</div>
      <div style={{ display: "grid", gap: 6 }}>
        {users.map(u => (
          <LoginUserButton key={u.id} user={u} onClick={() => onSelect(u)} />
        ))}
      </div>
    </div>
  );
}

function LoginUserButton({ user, onClick }) {
  const [hovered, setHovered] = useState(false);
  const unit = user.unitId ? UNITS[user.unitId] : null;
  const subUnit = user.subUnitId ? LIVE.subUnits.find(su => su.id === user.subUnitId) : null;

  let detail = ROLE_LABELS[user.role];
  if (subUnit && unit) detail = `${ROLE_LABELS[user.role]} • ${subUnit.name}`;
  else if (unit) detail = `${ROLE_LABELS[user.role]} • ${unit.name}`;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "10px 12px",
        border: `1px solid ${hovered ? COLORS.primary : COLORS.border}`,
        borderRadius: 10,
        background: hovered ? "#F8FAFC" : COLORS.white,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 11,
        textAlign: "left",
        fontFamily: "inherit",
        transition: "all 0.15s",
      }}
    >
      <span style={{
        width: 34, height: 34, borderRadius: 99,
        background: COLORS.bgMuted, color: COLORS.text,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 800, flexShrink: 0,
      }}>{user.name.charAt(0)}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark }}>{user.name}</div>
        <div style={{ fontSize: 10, color: COLORS.textMuted }}>{detail}</div>
      </div>
      <span style={{ color: COLORS.textLight, fontSize: 14 }}>→</span>
    </button>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// §7  NAVIGATION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Determine navigation items available for a given role.
 * Each menu maps to a page key handled in App router.
 */
function getNavItems(role) {
  switch (role) {
    case ROLES.OWNER:
      return [
        ["dashboard", "Dashboard", "dashboard"],
        ["projects",  "Project",   "project"],
        ["margin",    "Margin",    "margin"],
        ["kpi",       "KPI",       "kpi"],
        ["inbox",     "Inbox",     "inbox"],
        ["audit",     "Audit",     "audit"],
        ["admin",     "Admin",     "admin"],
      ];
    case ROLES.FINANCE:
    case ROLES.HR:
      return [
        ["dashboard", "Dashboard", "dashboard"],
        ["projects",  "Project",   "project"],
        ["margin",    "Margin",    "margin"],
        ["kpi",       "KPI",       "kpi"],
      ];
    case ROLES.LEADER:
      return [
        ["workspace", "Workspace",   "workspace"],
        ["projects",  "Project",     "project"],
        ["kpi",       "KPI", "kpi"],
        ["inbox",     "Inbox",       "inbox"],
        ["audit",     "Audit",       "audit"],
      ];
    case ROLES.PIC:
      return [
        ["workspace", "Workspace",   "workspace"],
        ["projects",  "Project",     "project"],
        ["kpi",       "KPI", "kpi"],
        ["inbox",     "Inbox",       "inbox"],
      ];
    default:
      return [];
  }
}

function TopNav({ user, currentPage, onNavigate, onLogout }) {
  const navItems = getNavItems(user.role);
  const inboxCount = getInboxCount(user);

  return (
    <div style={{
      background: COLORS.dark,
      height: 56,
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      gap: 10,
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: COLORS.darker,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <img src={GDN_LOGO} alt="GDN" style={{ height: 26, width: "auto", display: "block" }} />
      </div>
      <span style={{ fontFamily: FONTS.heading, color: COLORS.white, fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>{APP_CONFIG.name}</span>

      <div style={{
        display: "flex",
        gap: 3,
        marginLeft: 8,
        overflowX: "auto",
        flex: 1,
        minWidth: 0,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}>
        {navItems.map(([key, label, iconName]) => {
          const active = currentPage === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              style={{
                padding: "7px 11px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: active ? "rgba(255,255,255,0.10)" : "transparent",
                color: active ? COLORS.white : "rgba(255,255,255,0.55)",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "inherit",
                position: "relative",
              }}
            >
              <Icon name={iconName} size={15} color={active ? COLORS.gold : "rgba(255,255,255,0.55)"} />
              {label}
              {key === "inbox" && inboxCount > 0 && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  borderRadius: 99,
                  background: COLORS.danger,
                  color: COLORS.white,
                  fontSize: 9,
                  fontWeight: 800,
                }}>{inboxCount}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 12px 4px 8px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: 99,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 99,
            background: COLORS.gold,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: COLORS.dark, fontSize: 11, fontWeight: 800,
          }}>{user.name.charAt(0)}</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ color: COLORS.white, fontSize: 10, fontWeight: 700 }}>{user.name}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9 }}>{ROLE_LABELS[user.role]}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: "6px 10px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 7,
            color: "rgba(255,255,255,0.7)",
            fontSize: 10,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Icon name="logout" size={13} color="rgba(255,255,255,0.7)" />
          Keluar
        </button>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// §8  OWNER PAGES
// ════════════════════════════════════════════════════════════════════════════

function OwnerDashboard({ user, onSelectUnit, onSelectProject }) {
  const store = useDataStore(); // subscribe to live in-session data so this page re-renders on changes
  const periods = useMemo(() => getAvailablePeriods(), []);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState("2026-05");
  const selectedPeriod = periods.find(p => p.key === selectedPeriodKey) || periods[periods.length - 2];

  // Live data deps so memos recompute when store changes
  const liveDeps = [selectedPeriodKey, store?.submissions, store?.subUnits, store?.subUnitWeights];

  // KPI data (period-aware)
  const unitsWithScores = useMemo(() =>
    Object.values(UNITS).map(u => {
      const r = calculateUnitScoreForPeriod(u.id, selectedPeriod);
      return {
        ...u,
        score: r.score,
        contributingCount: r.contributingCount,
        totalSubUnits: r.totalSubUnits,
        subUnitCount: getSubUnitsByUnit(u.id).length,
      };
    }),
    liveDeps
  );

  // Project data
  const unitsWithProjects = useMemo(() =>
    Object.values(UNITS).map(u => {
      const projects = getProjectsByUnit(u.id);
      return { ...u, projects };
    }).filter(u => u.projects.length > 0),
    [store?.projects]
  );

  // Margin data (period-aware)
  const unitsWithMargin = useMemo(() =>
    Object.values(UNITS).map(u => ({
      ...u,
      margin: calculateUnitMarginForPeriod(u.id, selectedPeriod),
    })).filter(u => u.margin.target > 0 || u.margin.pendingTotal > 0),
    liveDeps
  );

  const grandTotalMargin = useMemo(
    () => calculateGrandTotalMarginForPeriod(selectedPeriod),
    liveDeps
  );

  // Top-level stats (only units that contributed)
  const contributingUnits = unitsWithScores.filter(u => u.contributingCount > 0);
  const onTrackCount = contributingUnits.filter(u => u.score >= STATUS_THRESHOLDS.onTrack).length;
  const avgScore = contributingUnits.length > 0
    ? Math.round(contributingUnits.reduce((sum, u) => sum + u.score, 0) / contributingUnits.length)
    : 0;
  const totalProjects = LIVE.projects.length;
  const projectsAtRisk = LIVE.projects.filter(p => p.status === "at_risk" || p.status === "behind").length;

  // Budget summary (period-aware, milestone-date based)
  const budgetSummary = useMemo(() => calculateBudgetSummary(selectedPeriod), [selectedPeriodKey, store?.milestones, store?.expenses, store?.projects]);

  // Quick-switch handlers
  const setToCurrentMonth = () => setSelectedPeriodKey("2026-05");
  const setToYTD = () => setSelectedPeriodKey("ytd-2026");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 14px" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 26, fontWeight: 700, color: COLORS.dark, margin: 0, letterSpacing: -0.5 }}>
          Selamat datang, {user.name}
        </h1>
        <p style={{ fontSize: 12.5, color: COLORS.textMuted, margin: "4px 0 0" }}>
          Anda melihat semua unit bisnis
        </p>
      </div>

      {/* Period Filter Bar */}
      <Card style={{ padding: "12px 16px", marginBottom: 18 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}>Periode:</div>

          {/* Period dropdown */}
          <select
            value={selectedPeriodKey}
            onChange={e => setSelectedPeriodKey(e.target.value)}
            style={{
              padding: "7px 12px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              background: COLORS.white,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "inherit",
              color: COLORS.dark,
              cursor: "pointer",
            }}
          >
            <optgroup label="Per Bulan">
              {periods.filter(p => p.type === "month").map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </optgroup>
            <optgroup label="Akumulasi">
              {periods.filter(p => p.type === "ytd").map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </optgroup>
          </select>

          {/* Quick toggles */}
          <button
            onClick={setToCurrentMonth}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: `1px solid ${selectedPeriodKey === "2026-05" ? COLORS.primary : COLORS.border}`,
              background: selectedPeriodKey === "2026-05" ? COLORS.primary : COLORS.white,
              color: selectedPeriodKey === "2026-05" ? COLORS.white : COLORS.text,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Bulan Ini
          </button>
          <button
            onClick={setToYTD}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: `1px solid ${selectedPeriodKey === "ytd-2026" ? COLORS.primary : COLORS.border}`,
              background: selectedPeriodKey === "ytd-2026" ? COLORS.primary : COLORS.white,
              color: selectedPeriodKey === "ytd-2026" ? COLORS.white : COLORS.text,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            YTD 2026
          </button>

          {/* Description */}
          <div style={{
            marginLeft: "auto",
            fontSize: 10,
            color: COLORS.textLight,
            fontStyle: "italic",
          }}>
            Hanya menampilkan KPI & margin yang closing di periode ini
          </div>
        </div>
      </Card>

      {/* Top-level summary cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 10,
        marginBottom: 26,
      }}>
        <StatCard
          label={`Pencapaian KPI · ${selectedPeriod.label}`}
          value={avgScore > 0 ? `${avgScore}%` : "—"}
          sub={avgScore > 0
            ? `${onTrackCount}/${contributingUnits.length} unit on track`
            : "Belum ada closing di periode ini"
          }
          icon=""
          color={COLORS.primary}
        />
        <StatCard
          label="Project Aktif"
          value={totalProjects}
          sub={projectsAtRisk > 0 ? `${projectsAtRisk} butuh perhatian` : "Semua jalan baik"}
          icon=""
          color={COLORS.warning}
        />
        <StatCard
          label={`Realisasi Margin · ${selectedPeriod.label}`}
          value={grandTotalMargin.target > 0 ? `${grandTotalMargin.percentage}%` : "—"}
          sub={grandTotalMargin.target > 0
            ? `${formatRupiah(grandTotalMargin.actual)} / ${formatRupiah(grandTotalMargin.target)}`
            : "Belum ada closing di periode ini"
          }
          icon=""
          color={COLORS.success}
        />
      </div>

      {/* Budget summary — 6 boxes in 2 rows (Owner & Finance) */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
          <Icon name="money" size={14} color={COLORS.secondary} />
          Ringkasan Budget Project
        </div>

        {/* Row 1: periode terpilih */}
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textLight, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
          {selectedPeriod.label}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
          <BudgetBox
            label={`Kebutuhan · ${selectedPeriod.label}`}
            value={budgetSummary.needThisMonth}
            accent={COLORS.primary}
            sub="Rencana — by tanggal target milestone"
          />
          <BudgetBox
            label={`Realisasi · ${selectedPeriod.label}`}
            value={budgetSummary.realisasiThisMonth}
            accent={COLORS.warning}
            sub="Aktual — by tanggal pembayaran"
          />
          <BudgetBox
            label={`Sisa · ${selectedPeriod.label}`}
            value={budgetSummary.sisaThisMonth}
            accent={budgetSummary.sisaThisMonth >= 0 ? COLORS.success : COLORS.danger}
            sub={
              budgetSummary.needThisMonth === 0 && budgetSummary.realisasiThisMonth === 0
                ? "Tidak ada aktivitas bulan ini"
                : budgetSummary.sisaThisMonth > 0
                  ? `${formatRupiah(budgetSummary.sisaThisMonth)} rencana belum terbayar`
                  : budgetSummary.sisaThisMonth < 0
                    ? `Realisasi ${formatRupiah(-budgetSummary.sisaThisMonth)} dari bulan lain`
                    : "Tepat sesuai jadwal"
            }
          />
        </div>

        {/* Row 2: all periode */}
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textLight, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
          All Periode
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <BudgetBox
            label="Kebutuhan All Periode"
            value={budgetSummary.needAllPeriod}
            accent={COLORS.secondary}
            sub="Total semua milestone project"
          />
          <BudgetBox
            label="Realisasi All Periode"
            value={budgetSummary.realisasiAllPeriod}
            accent={COLORS.warning}
            sub={budgetSummary.needAllPeriod > 0
              ? `${Math.round((budgetSummary.realisasiAllPeriod / budgetSummary.needAllPeriod) * 100)}% dari total kebutuhan`
              : "Belum ada realisasi"}
          />
          <BudgetBox
            label="Sisa All Periode"
            value={budgetSummary.sisaAllPeriod}
            accent={budgetSummary.sisaAllPeriod >= 0 ? COLORS.success : COLORS.danger}
            sub={budgetSummary.sisaAllPeriod >= 0 ? "Belum terpakai" : "Realisasi melebihi rencana"}
          />
        </div>
      </div>

      {/* SECTION 1: KPI per Unit */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader
          title={`KPI per Unit · ${selectedPeriod.label}`}
          subtitle="Hanya sub-unit yang closing di periode ini berkontribusi ke skor unit"
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}>
          {unitsWithScores.map(unit => (
            <UnitCard
              key={unit.id}
              unit={unit}
              period={selectedPeriod}
              onClick={() => onSelectUnit(unit.id)}
            />
          ))}
        </div>
      </div>

      {/* SECTION 2: Project per Unit */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader
          title="Project per Unit"
          subtitle="Snapshot progress saat ini (project berjalan lintas periode)"
        />
        {unitsWithProjects.length === 0 ? (
          <Card style={{ padding: 24, textAlign: "center", color: COLORS.textLight, fontSize: 12 }}>
            Belum ada project aktif
          </Card>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 12,
          }}>
            {unitsWithProjects.map(unit => (
              <ProjectUnitCard key={unit.id} unit={unit} onSelectProject={onSelectProject} />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Margin per Unit */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader
          title={`Margin per Unit · ${selectedPeriod.label}`}
          subtitle="Hanya margin yang closing di periode ini dihitung. Siklus berjalan ditampilkan sebagai pending."
        />
        {unitsWithMargin.length === 0 ? (
          <Card style={{ padding: 24, textAlign: "center", color: COLORS.textLight, fontSize: 12 }}>
            Belum ada margin closing di {selectedPeriod.label}
          </Card>
        ) : (
          <Card style={{ padding: 0 }}>
            {unitsWithMargin.map((unit, i) => (
              <MarginUnitRow
                key={unit.id}
                unit={unit}
                isLast={i === unitsWithMargin.length - 1}
              />
            ))}
            {/* Grand total */}
            <div style={{
              padding: "16px 18px",
              background: `linear-gradient(135deg, ${COLORS.dark}, #1E293B)`,
              borderTop: `1px solid ${COLORS.border}`,
              color: COLORS.white,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    color: "rgba(255,255,255,0.7)",
                  }}>Total Semua Unit · {selectedPeriod.label}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>
                    Target: {formatRupiah(grandTotalMargin.target)}
                    {" • "}
                    Realisasi: {formatRupiah(grandTotalMargin.actual)}
                    {grandTotalMargin.pendingTotal > 0 && (
                      <> • Pending: {formatRupiah(grandTotalMargin.pendingTotal)}</>
                    )}
                  </div>
                </div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: grandTotalMargin.percentage >= 100 ? "#86EFAC" : "#FCD34D",
                }}>
                  {grandTotalMargin.target > 0 ? `${grandTotalMargin.percentage}%` : "—"}
                </div>
              </div>
              {grandTotalMargin.target > 0 && (
                <ProgressBar
                  value={Math.min(grandTotalMargin.percentage, 100)}
                  color={grandTotalMargin.percentage >= 100 ? COLORS.success : COLORS.warning}
                  height={8}
                />
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }) {
  return (
    <Card style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{
            fontSize: 10,
            color: COLORS.textLight,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{sub}</div>
        </div>
        <div style={{ fontSize: 22, opacity: 0.35 }}>{icon}</div>
      </div>
    </Card>
  );
}

function BudgetBox({ label, value, accent, sub }) {
  return (
    <div style={{
      padding: "14px 16px",
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      borderLeft: `4px solid ${accent}`,
    }}>
      <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, color: accent, marginTop: 5 }}>
        {formatRupiah(value)}
      </div>
      <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 3 }}>
        {sub}
      </div>
    </div>
  );
}

function UnitCard({ unit, period, onClick }) {
  const status = getScoreStatus(unit.score);
  const subUnits = getSubUnitsByUnit(unit.id).map(su => ({
    ...su,
    snapshot: period ? getSubUnitSnapshotForPeriod(su.id, period) : getSubUnitSnapshot(su.id),
    pic: getUser(su.picId),
  }));

  const hasContributors = unit.contributingCount > 0;

  return (
    <Card hover onClick={onClick}>
      <div style={{
        background: unit.color,
        padding: "12px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name={unit.icon} size={20} color={COLORS.white} />
          <div>
            <div style={{ color: COLORS.white, fontWeight: 800, fontSize: 13 }}>{unit.name}</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 10 }}>
              {unit.leaderId ? `Leader: ${getUser(unit.leaderId)?.name}` : "Tanpa Leader"}
            </div>
          </div>
        </div>
        <Pill color={COLORS.white} bg="rgba(255,255,255,0.25)">
          {hasContributors ? `${unit.score}%` : "—"}
        </Pill>
      </div>

      <div style={{ padding: "11px 14px" }}>
        {subUnits.length === 0 && (
          <div style={{ fontSize: 11, color: COLORS.textLight, textAlign: "center", padding: "12px 0" }}>
            Belum ada sub unit
          </div>
        )}
        {subUnits.slice(0, 3).map(su => (
          <UnitCardSubUnitRow key={su.id} subUnit={su} />
        ))}
        {subUnits.length > 3 && (
          <div style={{ fontSize: 10, color: COLORS.textLight, textAlign: "center", marginTop: 6 }}>
            +{subUnits.length - 3} sub unit lainnya
          </div>
        )}
      </div>

      <div style={{
        padding: "7px 14px",
        borderTop: `1px solid ${COLORS.bgMuted}`,
        background: "#FAFBFC",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 10,
        color: COLORS.textMuted,
      }}>
        <span>{unit.contributingCount !== undefined
          ? `${unit.contributingCount}/${unit.totalSubUnits} closing`
          : `${subUnits.length} sub unit`}
        </span>
        <Pill color={status.color} bg={status.bg}>{status.label}</Pill>
      </div>
    </Card>
  );
}

function UnitCardSubUnitRow({ subUnit }) {
  const snapshot = subUnit.snapshot;
  const hasSnapshot = snapshot !== null;
  const score = hasSnapshot ? snapshot.score : 0;
  const status = getScoreStatus(score);

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 11,
        marginBottom: 3,
      }}>
        <span style={{ color: COLORS.text, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Icon name={subUnit.icon} size={13} color={COLORS.textMuted} /> {subUnit.name}
        </span>
        <span style={{
          color: hasSnapshot ? status.color : COLORS.textLight,
          fontWeight: 700,
        }}>
          {hasSnapshot ? `${score}%` : "—"}
        </span>
      </div>
      <ProgressBar
        value={hasSnapshot ? score : 0}
        color={hasSnapshot ? status.color : COLORS.textLight}
        height={5}
      />
      <div style={{
        fontSize: 9,
        color: COLORS.textLight,
        marginTop: 2,
        display: "flex",
        justifyContent: "space-between",
      }}>
        <span>PIC: {subUnit.pic?.name || "— Kosong"}</span>
        <span>
          {hasSnapshot ? `Bobot: ${snapshot.weight}%` : "Belum closing"}
        </span>
      </div>
    </div>
  );
}

/**
 * Project card showing all projects of one unit with dual progress bars.
 */
function ProjectUnitCard({ unit, onSelectProject }) {
  const projects = unit.projects;
  const totalBudget = projects.reduce((sum, p) => sum + p.budgetPlanned, 0);
  const totalSpent  = projects.reduce((sum, p) => sum + p.budgetSpent, 0);
  const avgWorkProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + calculateProjectProgress(p).workProgress, 0) / projects.length)
    : 0;

  return (
    <Card>
      {/* Header */}
      <div style={{
        background: unit.color,
        padding: "11px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name={unit.icon} size={20} color={COLORS.white} />
          <div>
            <div style={{ color: COLORS.white, fontWeight: 800, fontSize: 13 }}>{unit.name}</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 10 }}>
              {projects.length} project aktif
            </div>
          </div>
        </div>
        <Pill color={COLORS.white} bg="rgba(255,255,255,0.25)">{avgWorkProgress}%</Pill>
      </div>

      {/* Projects list */}
      <div style={{ padding: "11px 14px" }}>
        {projects.slice(0, 3).map(p => (
          <ProjectRow key={p.id} project={p} onSelect={onSelectProject} />
        ))}
        {projects.length > 3 && (
          <div style={{ fontSize: 10, color: COLORS.textLight, textAlign: "center", marginTop: 6 }}>
            +{projects.length - 3} project lainnya
          </div>
        )}
      </div>

      {/* Footer summary */}
      <div style={{
        padding: "8px 14px",
        borderTop: `1px solid ${COLORS.bgMuted}`,
        background: "#FAFBFC",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 10,
        color: COLORS.textMuted,
      }}>
        <span>{formatRupiah(totalSpent)} / {formatRupiah(totalBudget)}</span>
        <span>Budget terpakai: {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%</span>
      </div>
    </Card>
  );
}

/**
 * One project row inside ProjectUnitCard with dual progress bars.
 */
function ProjectRow({ project, onSelect }) {
  const { workProgress, budgetProgress } = calculateProjectProgress(project);
  const statusInfo = getProjectStatusInfo(project.status);

  return (
    <div
      onClick={onSelect ? () => onSelect(project.id) : undefined}
      style={{
        padding: "8px 6px",
        borderBottom: `1px dashed ${COLORS.bgMuted}`,
        marginBottom: 6,
        marginLeft: -6,
        marginRight: -6,
        borderRadius: 6,
        cursor: onSelect ? "pointer" : "default",
        transition: "background 0.15s",
      }}
      onMouseEnter={onSelect ? (e) => { e.currentTarget.style.background = COLORS.bgMuted; } : undefined}
      onMouseLeave={onSelect ? (e) => { e.currentTarget.style.background = "transparent"; } : undefined}
    >
      {/* Project name & status */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
        gap: 8,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: COLORS.dark,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {project.name}
        </span>
        <Pill color={statusInfo.color} bg={statusInfo.bg}>{statusInfo.label}</Pill>
      </div>

      {/* Work progress */}
      <div style={{ marginBottom: 4 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          color: COLORS.textMuted,
          marginBottom: 2,
        }}>
          <span>Pekerjaan ({project.milestonesDone}/{project.milestonesTotal})</span>
          <span style={{ fontWeight: 700, color: COLORS.text }}>{workProgress}%</span>
        </div>
        <ProgressBar value={workProgress} color={statusInfo.color} height={4} />
      </div>

      {/* Budget progress */}
      <div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          color: COLORS.textMuted,
          marginBottom: 2,
        }}>
          <span>Budget</span>
          <span style={{ fontWeight: 700, color: COLORS.text }}>
            {formatRupiah(project.budgetSpent)} / {formatRupiah(project.budgetPlanned)}
          </span>
        </div>
        <ProgressBar
          value={budgetProgress}
          color={budgetProgress > 100 ? COLORS.danger : budgetProgress > 85 ? COLORS.warning : COLORS.info}
          height={4}
        />
      </div>
    </div>
  );
}

/**
 * One unit row in the Margin section.
 */
function MarginUnitRow({ unit, isLast }) {
  const {
    target, actual, percentage,
    closedCount, closedEntries,
    pendingEntries, pendingTotal,
  } = unit.margin;

  const [showPendingDetail, setShowPendingDetail] = useState(false);

  const hasClosing = target > 0;
  const isOverTarget = percentage >= 100;
  const status = !hasClosing
    ? { color: COLORS.textLight, bg: COLORS.bgMuted, label: "Belum closing" }
    : isOverTarget
    ? { color: COLORS.success, bg: COLORS.successBg, label: "Over target" }
    : percentage >= 80
    ? { color: COLORS.warning, bg: COLORS.warningBg, label: "Mendekati target" }
    : { color: COLORS.danger, bg: COLORS.dangerBg, label: "Di bawah target" };

  return (
    <div style={{
      padding: "14px 18px",
      borderBottom: isLast ? "none" : `1px solid ${COLORS.bgMuted}`,
    }}>
      {/* Header row */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: unit.colorLight,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Icon name={unit.icon} size={17} color={unit.color} /></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.dark }}>{unit.name}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>
              {closedCount > 0 && `${closedCount} closing di periode ini`}
              {closedCount > 0 && pendingEntries.length > 0 && " • "}
              {pendingEntries.length > 0 && `${pendingEntries.length} pending closing`}
              {closedCount === 0 && pendingEntries.length === 0 && "Belum ada data"}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: status.color,
            lineHeight: 1,
          }}>{hasClosing ? `${percentage}%` : "—"}</div>
          <Pill color={status.color} bg={status.bg}>{status.label}</Pill>
        </div>
      </div>

      {/* Target & Actual */}
      {hasClosing && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 8,
            fontSize: 11,
          }}>
            <div>
              <div style={{ color: COLORS.textLight, fontWeight: 600, marginBottom: 2 }}>Target</div>
              <div style={{ color: COLORS.text, fontWeight: 700 }}>{formatRupiah(target)}</div>
            </div>
            <div>
              <div style={{ color: COLORS.textLight, fontWeight: 600, marginBottom: 2 }}>Realisasi</div>
              <div style={{ color: status.color, fontWeight: 700 }}>{formatRupiah(actual)}</div>
            </div>
          </div>

          {/* Progress bar */}
          <ProgressBar
            value={Math.min(percentage, 100)}
            color={status.color}
            height={6}
          />

          {/* Breakdown of closed entries */}
          {closedEntries.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 10, color: COLORS.textMuted }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Detail closing:</div>
              {closedEntries.map(entry => (
                <div key={entry.submissionId || entry.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 0",
                }}>
                  <span>• {getSubUnitName(entry.subUnitId)} — {entry.period}</span>
                  <span style={{ color: COLORS.text }}>
                    {formatRupiah(entry.actualMargin)}
                    <span style={{ color: COLORS.textLight }}> / {formatRupiah(entry.targetMargin)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pending detail (collapsible) */}
      {pendingEntries.length > 0 && (
        <div style={{
          marginTop: hasClosing ? 8 : 0,
          padding: "8px 10px",
          background: COLORS.warningBg,
          borderRadius: 6,
          fontSize: 10,
          color: "#92400E",
        }}>
          <div
            onClick={() => setShowPendingDetail(!showPendingDetail)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <span>Estimasi siklus/event berjalan: <strong>+{formatRupiah(pendingTotal)}</strong>
              {" "}({pendingEntries.length} entry, belum closing)
            </span>
            <span style={{ fontSize: 11 }}>{showPendingDetail ? "▲" : "▼"}</span>
          </div>
          {showPendingDetail && (
            <div style={{
              marginTop: 6,
              paddingTop: 6,
              borderTop: "1px solid #FDE68A",
            }}>
              {pendingEntries.map(entry => (
                <div key={entry.submissionId || entry.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 0",
                }}>
                  <span>• {getSubUnitName(entry.subUnitId)} — {entry.period}</span>
                  <span>
                    {formatRupiah(entry.targetMargin)}
                    <span style={{ color: "#A16207" }}>
                      {" "}(closing: {entry.expectedCloseAt ? formatDate(entry.expectedCloseAt) : "—"})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UnitDetailPage({ unitId, onBack, onSelectSubmission }) {
  const store = useDataStore();
  const unit = UNITS[unitId];

  const baseSubUnits = useMemo(() =>
    getSubUnitsByUnit(unitId).map(su => ({
      ...su,
      snapshot: getSubUnitSnapshot(su.id),
      pic: getUser(su.picId),
      // most recent submission for this sub-unit (for resume + linking)
      submission: LIVE.submissions
        .filter(s => s.subUnitId === su.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null,
    })),
    [unitId, store?.subUnits, store?.submissions]
  );

  const [editingWeights, setEditingWeights] = useState(false);
  const [draftWeights, setDraftWeights] = useState({});

  // Effective weight: store override (cross-menu) → else snapshot weight
  const storeWeights = store?.subUnitWeights || {};
  const effWeight = (su) => {
    if (storeWeights[su.id] !== undefined) return storeWeights[su.id];
    return su.snapshot?.weight || 0;
  };

  const subUnits = baseSubUnits;

  // Resume calculation using EFFECTIVE weights; only sub-units with snapshot contribute
  const contributing = subUnits.filter(su => su.snapshot);
  const totalWeight = contributing.reduce((sum, su) => sum + effWeight(su), 0);
  const weightedSum = contributing.reduce((sum, su) => sum + (su.snapshot.score * effWeight(su)), 0);
  const unitScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const status = getScoreStatus(unitScore);

  // --- Weight editing handlers ---
  const startEditWeights = () => {
    const init = {};
    subUnits.forEach(su => { init[su.id] = effWeight(su); });
    setDraftWeights(init);
    setEditingWeights(true);
  };
  const cancelEditWeights = () => { setEditingWeights(false); };
  const draftTotal = Object.values(draftWeights).reduce((s, v) => s + (Number(v) || 0), 0);
  const saveWeights = () => {
    if (draftTotal !== 100) { alert(`Total bobot harus 100%. Saat ini ${draftTotal}%.`); return; }
    // Write to store so the new weights persist across all menus this session
    if (store) {
      store.setSubUnitWeights(prev => ({ ...prev, ...draftWeights }));
    }
    setEditingWeights(false);
    alert(
      "Bobot sub unit diperbarui.\n\n" +
      subUnits.map(su => `${su.name}: ${draftWeights[su.id]}%`).join("\n") +
      `\n\nSkor unit dihitung ulang otomatis & konsisten di semua menu.`
    );
  };

  if (!unit) return <div style={{ padding: 20 }}>Unit tidak ditemukan</div>;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 14px" }}>
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: COLORS.textMuted,
          cursor: "pointer",
          fontSize: 12,
          padding: "4px 0 8px",
          fontFamily: "inherit",
        }}
      >
        ← Kembali ke Dashboard
      </button>

      <div style={{
        background: `linear-gradient(135deg, ${unit.color}, ${unit.colorDark})`,
        padding: "20px 22px",
        borderRadius: 14,
        color: COLORS.white,
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.12)" }}><Icon name={unit.icon} size={28} color={COLORS.white} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>
              Unit Bisnis
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{unit.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>
              {unit.leaderId
                ? `Leader: ${getUser(unit.leaderId)?.name}`
                : "Tanpa Leader"}
              {" • "}
              {subUnits.length} sub unit
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>Pencapaian Unit</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{unitScore}%</div>
            <Pill color={COLORS.white} bg="rgba(255,255,255,0.2)">{status.label}</Pill>
          </div>
        </div>
      </div>

      <SectionHeader
        title="Sub Unit"
        subtitle={`Skor unit dihitung sebagai weighted average dari ${subUnits.length} sub unit`}
        action={
          !editingWeights ? (
            <button
              onClick={startEditWeights}
              type="button"
              style={{ padding: "7px 13px", background: COLORS.white, color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              <Icon name="edit" size={12} color={COLORS.primary} style={{ pointerEvents: "none" }} /> Atur Bobot
            </button>
          ) : null
        }
      />

      {/* Weight editor panel */}
      {editingWeights && (
        <Card style={{ padding: "16px 18px", marginBottom: 12, border: `1px solid ${COLORS.primary}` }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.primaryDark, marginBottom: 4 }}>
            Atur Bobot Sub Unit
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 14 }}>
            Tentukan seberapa besar pengaruh tiap sub unit ke skor unit. Total harus tepat 100%.
          </div>

          <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
            {subUnits.map(su => (
              <div key={su.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: COLORS.dark }}>
                  {su.name}
                  {!su.snapshot && (
                    <span style={{ fontSize: 10, color: COLORS.textLight, fontWeight: 400, fontStyle: "italic" }}> (belum closing periode ini)</span>
                  )}
                </div>
                <input
                  type="range"
                  min="0" max="100" step="5"
                  value={draftWeights[su.id] || 0}
                  onChange={e => setDraftWeights({ ...draftWeights, [su.id]: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: unit.color }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 78 }}>
                  <input
                    type="number"
                    min="0" max="100"
                    value={draftWeights[su.id] || 0}
                    onChange={e => setDraftWeights({ ...draftWeights, [su.id]: Math.max(0, Math.min(100, Number(e.target.value))) })}
                    style={{ width: 52, padding: "5px 7px", fontSize: 12, fontWeight: 700, textAlign: "right", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontFamily: "inherit" }}
                  />
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total indicator */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 14px", borderRadius: 8,
            background: draftTotal === 100 ? COLORS.successBg : COLORS.dangerBg,
            border: `1px solid ${draftTotal === 100 ? "#CDE3C2" : "#E8C9C5"}`,
            marginBottom: 14,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: draftTotal === 100 ? "#3F6E31" : COLORS.danger }}>
              Total Bobot: {draftTotal}%
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: draftTotal === 100 ? "#3F6E31" : COLORS.danger }}>
              {draftTotal === 100 ? "✓ Pas 100%" : draftTotal > 100 ? `Kelebihan ${draftTotal - 100}%` : `Kurang ${100 - draftTotal}%`}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={cancelEditWeights} type="button" style={adminBtnStyle}>Batal</button>
            <button
              onClick={saveWeights}
              type="button"
              disabled={draftTotal !== 100}
              style={{
                padding: "9px 20px", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 800,
                fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
                background: draftTotal === 100 ? COLORS.primary : COLORS.border,
                color: draftTotal === 100 ? COLORS.white : COLORS.textLight,
                cursor: draftTotal === 100 ? "pointer" : "not-allowed",
              }}
            >
              <Icon name="save" size={14} color={draftTotal === 100 ? COLORS.white : COLORS.textLight} style={{ pointerEvents: "none" }} />
              Simpan Bobot
            </button>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {subUnits.map(su => (
          <SubUnitDetailCard
            key={su.id}
            subUnit={su}
            parentUnit={unit}
            effectiveWeight={effWeight(su)}
            onSelect={su.submission && onSelectSubmission ? () => onSelectSubmission(su.submission.id) : undefined}
          />
        ))}
      </div>

      {/* Resume KPI: tabel perhitungan skor unit step-by-step */}
      <div style={{ marginTop: 22 }}>
        <SectionHeader
          title="Resume Perhitungan Skor Unit"
          subtitle="Bagaimana skor tiap sub unit dan bobotnya membentuk skor unit"
        />
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: COLORS.bgMuted }}>
                  <th style={{ ...tableHeaderStyle, textAlign: "left" }}>Sub Unit</th>
                  <th style={{ ...tableHeaderStyle, textAlign: "center" }}>Skor</th>
                  <th style={{ ...tableHeaderStyle, textAlign: "center" }}>Bobot</th>
                  <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Skor × Bobot</th>
                  <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Kontribusi</th>
                </tr>
              </thead>
              <tbody>
                {subUnits.map(su => {
                  const snap = su.snapshot;
                  if (!snap) {
                    return (
                      <tr key={su.id} style={{ borderBottom: `1px solid ${COLORS.border}`, opacity: 0.6 }}>
                        <td style={{ padding: "9px 12px", fontWeight: 700, color: COLORS.textMuted }}>{su.name}</td>
                        <td colSpan={4} style={{ padding: "9px 12px", textAlign: "center", fontSize: 11, color: COLORS.textLight, fontStyle: "italic" }}>
                          Belum closing di periode ini — tidak dihitung
                        </td>
                      </tr>
                    );
                  }
                  const w = effWeight(su);
                  const sxb = snap.score * w;
                  const contribution = totalWeight > 0 ? (sxb / totalWeight) : 0;
                  return (
                    <tr key={su.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: "9px 12px", fontWeight: 700, color: COLORS.dark }}>{su.name}</td>
                      <td style={{ padding: "9px 12px", textAlign: "center", color: COLORS.text }}>{snap.score}%</td>
                      <td style={{ padding: "9px 12px", textAlign: "center", color: COLORS.text }}>{w}%</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: COLORS.textMuted }}>{sxb.toLocaleString("id-ID")}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: unit.color }}>+{contribution.toFixed(1)} poin</td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr style={{ background: COLORS.bg, borderTop: `2px solid ${COLORS.border}` }}>
                  <td style={{ padding: "11px 12px", fontWeight: 800, color: COLORS.dark }}>Total</td>
                  <td style={{ padding: "11px 12px", textAlign: "center", color: COLORS.textLight }}>—</td>
                  <td style={{ padding: "11px 12px", textAlign: "center", fontWeight: 800, color: COLORS.dark }}>{totalWeight}%</td>
                  <td style={{ padding: "11px 12px", textAlign: "right", fontWeight: 800, color: COLORS.dark }}>{weightedSum.toLocaleString("id-ID")}</td>
                  <td style={{ padding: "11px 12px", textAlign: "right", fontWeight: 800, color: unit.color, fontSize: 14 }}>{unitScore}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 16px", background: COLORS.infoBg, borderTop: `1px solid #C5DBF0`, fontSize: 11.5, color: COLORS.primaryDark, lineHeight: 1.6 }}>
            <strong>Cara baca:</strong> Skor unit = Σ(Skor × Bobot) ÷ Σ(Bobot) = <strong>{weightedSum.toLocaleString("id-ID")} ÷ {totalWeight}</strong> = <strong>{unitScore}%</strong>.
            {contributing.length < subUnits.length && (
              <> Sub unit yang belum closing di periode ini tidak ikut dihitung agar skor tidak bias.</>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SubUnitDetailCard({ subUnit, parentUnit, onSelect, effectiveWeight }) {
  const snapshot = subUnit.snapshot;
  const score = snapshot?.score || 0;
  const weight = effectiveWeight !== undefined ? effectiveWeight : (snapshot?.weight || 0);
  const status = getScoreStatus(score);
  const submission = subUnit.submission;
  const template = submission ? getFormTemplate(submission.templateId) : null;

  // Which fields drive this sub-unit's score (the weighted KPI fields)
  const scoredFields = (submission && template)
    ? Object.keys(submission.fieldWeights || {})
        .map(fid => {
          const f = template.fields.find(ff => ff.id === fid);
          return f ? { name: f.name, weight: submission.fieldWeights[fid], isMargin: f.isMargin } : null;
        })
        .filter(Boolean)
    : [];

  return (
    <Card
      style={{ padding: "14px 16px", cursor: onSelect ? "pointer" : "default", transition: "box-shadow 0.15s" }}
      onClick={onSelect}
      onMouseEnter={onSelect ? (e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.10)"; } : undefined}
      onMouseLeave={onSelect ? (e) => { e.currentTarget.style.boxShadow = ""; } : undefined}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: parentUnit.colorLight,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}><Icon name={subUnit.icon} size={24} color={parentUnit.color} /></div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.dark }}>{subUnit.name}</span>
            <Pill color={status.color} bg={status.bg}>{status.label}</Pill>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>
            PIC: <strong style={{ color: COLORS.text }}>{subUnit.pic?.name || "— Belum ditugaskan"}</strong>
            {" • "}
            Dibuat: {formatDate(subUnit.createdAt)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <ProgressBar value={score} color={status.color} height={7} />
            </div>
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              color: status.color,
              minWidth: 40,
              textAlign: "right",
            }}>
              {score}%
            </span>
          </div>
        </div>

        <div style={{ textAlign: "right", minWidth: 70 }}>
          <div style={{ fontSize: 9, color: COLORS.textLight, fontWeight: 700, textTransform: "uppercase" }}>Bobot</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: parentUnit.color }}>{weight}%</div>
        </div>
      </div>

      {/* Mini-resume: from which KPI & which fields the score comes */}
      {submission ? (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${COLORS.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <span style={{ fontSize: 10.5, color: COLORS.textMuted }}>
              Skor dari KPI: <strong style={{ color: COLORS.text }}>{template?.name || "—"}</strong>
              {" • "}{submission.period}
            </span>
            {onSelect && (
              <span style={{ fontSize: 10.5, color: parentUnit.color, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                Lihat detail <Icon name="arrowRight" size={11} color={parentUnit.color} style={{ pointerEvents: "none" }} />
              </span>
            )}
          </div>
          {scoredFields.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {scoredFields.map((f, i) => (
                <span key={i} style={{
                  fontSize: 10, padding: "3px 8px", borderRadius: 6,
                  background: f.isMargin ? COLORS.warningBg : COLORS.bgMuted,
                  color: f.isMargin ? "#8A6420" : COLORS.textMuted,
                  border: `1px solid ${f.isMargin ? "#EBD9B4" : COLORS.border}`,
                  fontWeight: 600,
                }}>
                  {f.name} · {f.weight}%{f.isMargin ? " ⭐" : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${COLORS.border}`, fontSize: 10.5, color: COLORS.textLight, fontStyle: "italic" }}>
          Belum ada KPI yang diinput untuk sub unit ini
        </div>
      )}
    </Card>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// §8.5  SHARED PAGES (Project, Margin, KPI, Inbox, Audit)
// Used across roles (Owner, Leader, PIC, Finance) with data filtered by role
// ════════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────
// Project List Page
// ──────────────────────────────────────────────────────────────────────────

/**
 * List of projects visible to the current user.
 * Owner sees all; Leader sees their unit; PIC sees their sub-unit.
 */
function ProjectListPage({ user, onSelectProject, onNewProject }) {
  const store = useDataStore();
  const allProjects = useMemo(() => getProjectsForUser(user), [user, store?.projects]);
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = allProjects.filter(p => {
    if (filterUnit !== "all" && p.unitId !== filterUnit) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: allProjects.length,
    onTrack: allProjects.filter(p => p.status === "on_track").length,
    atRisk: allProjects.filter(p => p.status === "at_risk").length,
    behind: allProjects.filter(p => p.status === "behind").length,
  };

  // Units available to filter (only those user can see)
  const visibleUnitIds = Array.from(new Set(allProjects.map(p => p.unitId)));

  // Finance/HR are read-only; Owner, Leader, PIC may propose projects
  const canPropose = [ROLES.OWNER, ROLES.LEADER, ROLES.PIC].includes(user.role);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 14px" }}>
      {/* Header */}
      <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: COLORS.dark, margin: 0 }}>Project Lintas Unit
          </h1>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "4px 0 0" }}>
            Total {stats.total} project • {stats.onTrack} on track • {stats.atRisk} perhatian • {stats.behind} tertinggal
          </p>
        </div>
        {canPropose && onNewProject && (
          <button
            onClick={onNewProject}
            style={{
              padding: "10px 16px",
              background: COLORS.primary,
              color: COLORS.white,
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              flexShrink: 0,
            }}
          >
            <Icon name="plus" size={15} color={COLORS.white} />
            Ajukan Project Baru
          </button>
        )}
      </div>

      {/* Filters */}
      <Card style={{ padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Filter:
          </div>
          <select
            value={filterUnit}
            onChange={e => setFilterUnit(e.target.value)}
            style={{
              padding: "7px 12px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              background: COLORS.white,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <option value="all">Semua Unit</option>
            {visibleUnitIds.map(uid => (
              <option key={uid} value={uid}>{UNITS[uid].name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              padding: "7px 12px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              background: COLORS.white,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <option value="all">Semua Status</option>
            <option value="on_track">On Track</option>
            <option value="at_risk">Perhatian</option>
            <option value="behind">Tertinggal</option>
            <option value="done">Selesai</option>
          </select>
          <div style={{ marginLeft: "auto", fontSize: 11, color: COLORS.textMuted }}>
            Menampilkan {filtered.length} dari {allProjects.length} project
          </div>
        </div>
      </Card>

      {/* Project cards */}
      {filtered.length === 0 ? (
        <Card style={{ padding: 30, textAlign: "center", color: COLORS.textLight, fontSize: 12 }}>
          Tidak ada project yang sesuai filter
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.map(p => (
            <ProjectListItem
              key={p.id}
              project={p}
              onClick={() => onSelectProject(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectListItem({ project, onClick }) {
  const unit = UNITS[project.unitId];
  const subUnit = project.subUnitId ? LIVE.subUnits.find(su => su.id === project.subUnitId) : null;
  const { workProgress, budgetProgress } = calculateProjectProgress(project);
  const status = getProjectStatusInfo(project.status);

  return (
    <Card hover onClick={onClick} style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11,
          background: unit.colorLight,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}><Icon name={unit.icon} size={22} color={unit.color} /></div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.dark }}>{project.name}</span>
            <Pill color={status.color} bg={status.bg}>{status.label}</Pill>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>
            {unit.name}{subUnit && <> · {subUnit.name}</>} • {project.milestonesDone}/{project.milestonesTotal} milestone • {formatDate(project.startDate)} → {formatDate(project.endDate)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Work progress */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
                <span style={{ color: COLORS.textMuted, fontWeight: 600 }}>Pekerjaan</span>
                <span style={{ color: COLORS.text, fontWeight: 700 }}>{workProgress}%</span>
              </div>
              <ProgressBar value={workProgress} color={status.color} height={5} />
            </div>

            {/* Budget progress */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
                <span style={{ color: COLORS.textMuted, fontWeight: 600 }}>Budget</span>
                <span style={{ color: COLORS.text, fontWeight: 700 }}>
                  {formatRupiah(project.budgetSpent)} / {formatRupiah(project.budgetPlanned)}
                </span>
              </div>
              <ProgressBar
                value={budgetProgress}
                color={budgetProgress > 100 ? COLORS.danger : budgetProgress > 85 ? COLORS.warning : COLORS.info}
                height={5}
              />
            </div>
          </div>
        </div>

        <div style={{ color: COLORS.textLight, fontSize: 18 }}>→</div>
      </div>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Margin Detail Page
// ──────────────────────────────────────────────────────────────────────────

/**
 * Detail margin per unit, with drill-down per entry.
 */
function MarginDetailPage({ user }) {
  const store = useDataStore(); // subscribe to live in-session data so this page re-renders on changes
  const periods = useMemo(() => getAvailablePeriods(), []);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState("2026-05");
  const selectedPeriod = periods.find(p => p.key === selectedPeriodKey) || periods[periods.length - 2];

  // Filter units based on user role
  const visibleUnits = useMemo(() => {
    if (user.role === ROLES.LEADER) return [UNITS[user.unitId]];
    if (user.role === ROLES.PIC) {
      const sub = LIVE.subUnits.find(s => s.id === user.subUnitId);
      return sub ? [UNITS[sub.unitId]] : [];
    }
    return Object.values(UNITS);
  }, [user]);

  const unitsWithMargin = useMemo(() =>
    visibleUnits.map(u => ({
      ...u,
      margin: calculateUnitMarginForPeriod(u.id, selectedPeriod),
    })),
    [selectedPeriodKey, visibleUnits, store?.submissions]
  );

  const grandTotal = useMemo(
    () => calculateGrandTotalMarginForPeriod(selectedPeriod),
    [selectedPeriodKey, store?.submissions]
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 14px" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: COLORS.dark, margin: 0 }}>Detail Margin
        </h1>
        <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "4px 0 0" }}>
          Drill-down per unit dan per entry submission
        </p>
      </div>

      {/* Period filter */}
      <Card style={{ padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>Periode:
          </div>
          <select
            value={selectedPeriodKey}
            onChange={e => setSelectedPeriodKey(e.target.value)}
            style={{
              padding: "7px 12px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              background: COLORS.white,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <optgroup label="Per Bulan">
              {periods.filter(p => p.type === "month").map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </optgroup>
            <optgroup label="Akumulasi">
              {periods.filter(p => p.type === "ytd").map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </Card>

      {/* Per-unit breakdown */}
      {unitsWithMargin.map(unit => (
        <MarginDetailUnitCard key={unit.id} unit={unit} />
      ))}

      {/* Grand total (only Owner / Finance / HR) */}
      {(user.role === ROLES.OWNER || user.role === ROLES.FINANCE || user.role === ROLES.HR) && (
        <Card style={{
          marginTop: 12,
          padding: "18px 22px",
          background: `linear-gradient(135deg, ${COLORS.dark}, #1E293B)`,
          color: COLORS.white,
          border: "none",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: 0.6,
                color: "rgba(255,255,255,0.7)",
              }}>Total Semua Unit · {selectedPeriod.label}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>
                Target: <strong>{formatRupiah(grandTotal.target)}</strong>
                {" • "}
                Realisasi: <strong>{formatRupiah(grandTotal.actual)}</strong>
                {grandTotal.pendingTotal > 0 && (
                  <> • Pending: <strong>{formatRupiah(grandTotal.pendingTotal)}</strong></>
                )}
              </div>
            </div>
            <div style={{
              fontSize: 28, fontWeight: 800,
              color: grandTotal.percentage >= 100 ? "#86EFAC" : "#FCD34D",
            }}>
              {grandTotal.target > 0 ? `${grandTotal.percentage}%` : "—"}
            </div>
          </div>
          {grandTotal.target > 0 && (
            <ProgressBar
              value={Math.min(grandTotal.percentage, 100)}
              color={grandTotal.percentage >= 100 ? COLORS.success : COLORS.warning}
              height={8}
            />
          )}
        </Card>
      )}
    </div>
  );
}

function MarginDetailUnitCard({ unit }) {
  const { target, actual, percentage, closedEntries, pendingEntries, pendingTotal } = unit.margin;
  const [expanded, setExpanded] = useState(true);

  const hasClosing = target > 0;
  const status = !hasClosing
    ? { color: COLORS.textLight, bg: COLORS.bgMuted, label: "Belum closing" }
    : percentage >= 100
    ? { color: COLORS.success, bg: COLORS.successBg, label: "Over target" }
    : percentage >= 80
    ? { color: COLORS.warning, bg: COLORS.warningBg, label: "Mendekati" }
    : { color: COLORS.danger, bg: COLORS.dangerBg, label: "Di bawah" };

  return (
    <Card style={{ padding: 0, marginBottom: 10 }}>
      {/* Header (clickable) */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "14px 18px",
          borderBottom: expanded ? `1px solid ${COLORS.bgMuted}` : "none",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
        }}
      >
        <span style={{ display: "inline-flex", color: COLORS.textLight, transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}><Icon name="arrowRight" size={13} /></span>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: unit.colorLight,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Icon name={unit.icon} size={19} color={unit.color} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.dark }}>{unit.name}</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
            {closedEntries.length} closing{pendingEntries.length > 0 && ` · ${pendingEntries.length} pending`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>
            {formatRupiah(actual)} / {formatRupiah(target)}
          </div>
          <Pill color={status.color} bg={status.bg}>
            {hasClosing ? `${percentage}%` : "—"} {status.label}
          </Pill>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "12px 18px" }}>
          {hasClosing && (
            <ProgressBar value={Math.min(percentage, 100)} color={status.color} height={6} />
          )}

          {/* Closed entries */}
          {closedEntries.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: COLORS.success,
                textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6,
              }}>Sudah Closing ({closedEntries.length})
              </div>
              {closedEntries.map(entry => (
                <MarginEntryRow key={entry.submissionId || entry.id} entry={entry} />
              ))}
            </div>
          )}

          {/* Pending entries */}
          {pendingEntries.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: COLORS.warning,
                textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6,
              }}>Pending Closing ({pendingEntries.length})
              </div>
              {pendingEntries.map(entry => (
                <MarginEntryRow key={entry.submissionId || entry.id} entry={entry} isPending />
              ))}
              <div style={{
                marginTop: 6, padding: "6px 10px",
                background: COLORS.warningBg,
                borderRadius: 6,
                fontSize: 10, color: "#92400E",
                fontStyle: "italic",
              }}>
                Total estimasi pending: <strong>{formatRupiah(pendingTotal)}</strong>
              </div>
            </div>
          )}

          {closedEntries.length === 0 && pendingEntries.length === 0 && (
            <div style={{
              padding: "20px 0",
              textAlign: "center",
              color: COLORS.textLight,
              fontSize: 11,
            }}>
              Belum ada data margin di periode ini
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function MarginEntryRow({ entry, isPending }) {
  const subUnitName = getSubUnitName(entry.subUnitId);
  const achieved = entry.targetMargin > 0
    ? Math.round((entry.actualMargin / entry.targetMargin) * 100)
    : 0;

  return (
    <div style={{
      padding: "8px 10px",
      background: "#FAFBFC",
      borderRadius: 7,
      marginBottom: 5,
      display: "grid",
      gridTemplateColumns: "1fr auto auto",
      gap: 10,
      alignItems: "center",
      fontSize: 11,
    }}>
      <div>
        <div style={{ fontWeight: 700, color: COLORS.dark }}>{subUnitName}</div>
        <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 1 }}>
          {entry.period}
          {isPending && entry.expectedCloseAt && (
            <> • closing: {formatDate(entry.expectedCloseAt)}</>
          )}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 10, color: COLORS.textLight }}>Target</div>
        <div style={{ fontWeight: 600, color: COLORS.text }}>{formatRupiah(entry.targetMargin)}</div>
      </div>
      {isPending ? (
        <div style={{ minWidth: 60, textAlign: "right", color: COLORS.warning, fontStyle: "italic", fontSize: 11 }}>
          Pending
        </div>
      ) : (
        <div style={{ minWidth: 60, textAlign: "right" }}>
          <div style={{ fontSize: 10, color: COLORS.textLight }}>Aktual</div>
          <div style={{
            fontWeight: 700,
            color: achieved >= 100 ? COLORS.success : achieved >= 80 ? COLORS.warning : COLORS.danger,
          }}>
            {formatRupiah(entry.actualMargin)} <span style={{ fontSize: 10, opacity: 0.7 }}>({achieved}%)</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// KPI Page (performa & riwayat submission)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Table view of all KPI submissions (filtered by role).
 */
function KPIHistoryPage({ user, onSelectSubmission }) {
  const store = useDataStore();
  const submissions = useMemo(() => getSubmissionsForUser(user), [user, store?.submissions]);
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTemplate, setFilterTemplate] = useState("all");

  const filtered = submissions.filter(s => {
    if (filterUnit !== "all" && s.unitId !== filterUnit) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (filterTemplate !== "all" && s.templateId !== filterTemplate) return false;
    return true;
  });

  // Sort: most recent first
  const sorted = [...filtered].sort((a, b) => {
    const aDate = a.closedAt || a.approvedAt || a.createdAt;
    const bDate = b.closedAt || b.approvedAt || b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const visibleUnitIds = Array.from(new Set(submissions.map(s => s.unitId)));
  const visibleTemplateIds = Array.from(new Set(submissions.map(s => s.templateId)));

  // Aggregate summary across filtered submissions
  const summary = useMemo(() => {
    const perfs = filtered.map(s => ({ sub: s, perf: getSubmissionPerformance(s) }));
    const scored = perfs.filter(p => p.perf.score !== null);
    const avgScore = scored.length > 0
      ? Math.round(scored.reduce((sum, p) => sum + p.perf.score, 0) / scored.length)
      : 0;
    const onTrack = scored.filter(p => p.perf.score >= 90).length;
    const attention = scored.filter(p => p.perf.score >= 70 && p.perf.score < 90).length;
    const below = scored.filter(p => p.perf.score < 70).length;
    const marginTarget = perfs.reduce((sum, p) => sum + p.perf.marginTarget, 0);
    const marginActual = perfs.reduce((sum, p) => sum + p.perf.marginActual, 0);
    const active = filtered.filter(s => s.status === "approved").length;
    const closed = filtered.filter(s => s.status === "closed").length;
    return { avgScore, onTrack, attention, below, scoredCount: scored.length, marginTarget, marginActual, active, closed };
  }, [filtered]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 14px" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: COLORS.dark, margin: 0 }}>KPI
        </h1>
        <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "4px 0 0" }}>
          Performa & riwayat semua submission KPI ({submissions.length} total)
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 16 }}>
        <div style={{ padding: "14px 16px", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, borderLeft: `4px solid ${COLORS.primary}` }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>Rata-rata Skor</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.primary, marginTop: 4 }}>
            {summary.scoredCount > 0 ? `${summary.avgScore}%` : "—"}
          </div>
          <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 2 }}>dari {summary.scoredCount} KPI terskor</div>
        </div>
        <div style={{ padding: "14px 16px", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, borderLeft: `4px solid ${COLORS.success}` }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>Status Performa</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.dark, marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: COLORS.success }}>{summary.onTrack} ✓</span>
            <span style={{ color: COLORS.warning }}>{summary.attention} ◐</span>
            <span style={{ color: COLORS.danger }}>{summary.below} ✕</span>
          </div>
          <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 2 }}>on-track / perhatian / di bawah</div>
        </div>
        <div style={{ padding: "14px 16px", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, borderLeft: `4px solid ${COLORS.secondary}` }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>Total Margin</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.secondary, marginTop: 4 }}>
            {summary.marginActual > 0 ? formatRupiah(summary.marginActual) : "—"}
          </div>
          <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 2 }}>
            {summary.marginTarget > 0 ? `dari target ${formatRupiah(summary.marginTarget)}` : "belum ada closing"}
          </div>
        </div>
        <div style={{ padding: "14px 16px", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, borderLeft: `4px solid ${COLORS.info}` }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>Status KPI</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.dark, marginTop: 4 }}>
            {summary.active} aktif · {summary.closed} closed
          </div>
          <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 2 }}>{filtered.length} total terfilter</div>
        </div>
      </div>

      {/* Filters */}
      <Card style={{ padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
            Filter:
          </span>
          <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)}
            style={selectStyle}>
            <option value="all">Semua Unit</option>
            {visibleUnitIds.map(uid => (
              <option key={uid} value={uid}>{UNITS[uid].name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={selectStyle}>
            <option value="all">Semua Status</option>
            <option value="estimated">Menunggu Approval</option>
            <option value="approved">Aktif</option>
            <option value="closed">Closed</option>
          </select>
          <select value={filterTemplate} onChange={e => setFilterTemplate(e.target.value)}
            style={selectStyle}>
            <option value="all">Semua Template</option>
            {visibleTemplateIds.map(tid => {
              const t = getFormTemplate(tid);
              return <option key={tid} value={tid}>{t?.name || tid}</option>;
            })}
          </select>
          <div style={{ marginLeft: "auto", fontSize: 11, color: COLORS.textMuted }}>
            {filtered.length} dari {submissions.length}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Periode", "Sub Unit", "Template", "Skor", "Margin", "Status", "Tanggal"].map(h => (
                  <th key={h} style={{
                    padding: "10px 12px",
                    fontSize: 10, fontWeight: 700,
                    color: COLORS.textMuted,
                    textAlign: h === "Skor" || h === "Margin" ? "right" : "left",
                    textTransform: "uppercase", letterSpacing: 0.4,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 30, textAlign: "center", color: COLORS.textLight, fontSize: 12 }}>
                    Tidak ada submission yang sesuai filter
                  </td>
                </tr>
              ) : (
                sorted.map(sub => (
                  <KPIHistoryRow
                    key={sub.id}
                    submission={sub}
                    onClick={() => onSelectSubmission && onSelectSubmission(sub.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const selectStyle = {
  padding: "7px 12px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  background: COLORS.white,
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
};

function KPIHistoryRow({ submission, onClick }) {
  const sub = LIVE.subUnits.find(s => s.id === submission.subUnitId);
  const unit = sub ? UNITS[sub.unitId] : null;
  const template = getFormTemplate(submission.templateId);
  const perf = getSubmissionPerformance(submission);
  const scoreStatus = perf.score !== null ? getScoreStatus(perf.score) : null;
  const marginPct = perf.hasMargin ? Math.round((perf.marginActual / perf.marginTarget) * 100) : null;
  const STATUS_INFO = {
    estimated: { label: "Menunggu", color: COLORS.warning, bg: COLORS.warningBg },
    approved:  { label: "Aktif",    color: COLORS.success, bg: COLORS.successBg },
    closed:    { label: "Closed",   color: COLORS.primary, bg: COLORS.infoBg },
  };
  const info = STATUS_INFO[submission.status];

  const showDate = submission.closedAt || submission.approvedAt || submission.createdAt;

  return (
    <tr
      onClick={onClick}
      style={{
        borderTop: `1px solid ${COLORS.bgMuted}`,
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#FAFBFC"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <td style={{ padding: "10px 12px", color: COLORS.text }}>{submission.period}</td>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {unit && <Icon name={unit.icon} size={14} color={unit.color} />}
          <span style={{ fontWeight: 700, color: COLORS.dark }}>{sub?.name || "—"}</span>
        </div>
      </td>
      <td style={{ padding: "10px 12px", color: COLORS.textMuted }}>{template?.name}</td>
      {/* Skor */}
      <td style={{ padding: "10px 12px", textAlign: "right" }}>
        {perf.score !== null ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
            <span style={{ fontWeight: 800, color: scoreStatus.color }}>{perf.score}%</span>
            <div style={{ width: 56 }}><ProgressBar value={perf.score} color={scoreStatus.color} height={4} /></div>
          </div>
        ) : (
          <span style={{ color: COLORS.textLight, fontSize: 11 }}>—</span>
        )}
      </td>
      {/* Margin */}
      <td style={{ padding: "10px 12px", textAlign: "right" }}>
        {perf.hasMargin ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontWeight: 700, color: marginPct >= 100 ? COLORS.success : marginPct >= 80 ? COLORS.warning : COLORS.danger }}>
              {marginPct}%
            </span>
            <span style={{ fontSize: 10, color: COLORS.textLight }}>{formatRupiah(perf.marginActual)}</span>
          </div>
        ) : (
          <span style={{ color: COLORS.textLight, fontSize: 11 }}>—</span>
        )}
      </td>
      <td style={{ padding: "10px 12px" }}>
        <Pill color={info.color} bg={info.bg}>{info.label}</Pill>
      </td>
      <td style={{ padding: "10px 12px", color: COLORS.textMuted, fontSize: 11 }}>
        {formatDate(showDate)}
      </td>
    </tr>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Inbox Page (smart, role-aware)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Role-aware inbox showing relevant pending items.
 * - Owner: KPI submissions needing approval (embed ApprovalInbox)
 * - Leader: KPI in their unit needing closing/review
 * - PIC: KPI in their sub-unit needing action
 */
function InboxPage({ user, onSubmitNew, onCloseKPI, onViewDetail }) {
  useDataStore(); // subscribe to live in-session data so this page re-renders on changes
  // Owner gets the full ApprovalInbox with side-by-side detail view
  if (user.role === ROLES.OWNER) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 14px" }}>
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: COLORS.dark, margin: 0 }}>Approval Inbox
          </h1>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "4px 0 0" }}>
            Review estimasi KPI yang diajukan leader & PIC. Set bobot lalu approve.
          </p>
        </div>
        <ApprovalInbox />
      </div>
    );
  }

  // Leader / PIC: simpler list
  const items = useMemo(() => {
    if (user.role === ROLES.LEADER) {
      return LIVE.submissions
        .filter(s => s.unitId === user.unitId && s.status === "approved")
        .map(s => ({ ...s, inboxType: "running_in_unit" }));
    }
    if (user.role === ROLES.PIC) {
      return LIVE.submissions
        .filter(s => s.subUnitId === user.subUnitId && (s.status === "approved" || s.status === "estimated"))
        .map(s => ({
          ...s,
          inboxType: s.status === "estimated" ? "awaiting_owner" : "ready_to_close",
        }));
    }
    return [];
  }, [user]);

  const title = user.role === ROLES.LEADER ? "KPI di Unit Saya" : "Inbox Saya";
  const subtitle = user.role === ROLES.LEADER
    ? `${items.length} KPI yang sedang berjalan di unit Anda`
    : `${items.length} KPI menunggu aksi Anda`;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 14px" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: COLORS.dark, margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "4px 0 0" }}>{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}></div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.dark }}>
            Tidak ada item di inbox
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
            Semua KPI sudah ditangani.
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map(item => (
            <InboxItem
              key={item.id}
              item={item}
              userRole={user.role}
              onCloseKPI={onCloseKPI}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InboxItem({ item, userRole, onCloseKPI, onViewDetail }) {
  const sub = LIVE.subUnits.find(s => s.id === item.subUnitId);
  const unit = sub ? UNITS[sub.unitId] : null;
  const template = getFormTemplate(item.templateId);
  const submitter = getUser(item.createdBy);

  const INBOX_TYPES = {
    approval_needed: { icon: "clock", color: COLORS.warning, bg: COLORS.warningBg, action: "Review & Approve", actionVariant: "primary" },
    running_in_unit: { icon: "play", color: COLORS.primary, bg: COLORS.infoBg,        action: "Lihat Detail",     actionVariant: "secondary" },
    awaiting_owner:  { icon: "clock", color: COLORS.warning, bg: COLORS.warningBg, action: "Lihat Estimasi",   actionVariant: "secondary" },
    ready_to_close:  { icon: "lock", color: COLORS.success, bg: COLORS.successBg, action: "Tutup KPI",        actionVariant: "primary" },
  };
  const config = INBOX_TYPES[item.inboxType] || INBOX_TYPES.running_in_unit;

  const handleClick = () => {
    if (item.inboxType === "ready_to_close" && onCloseKPI) {
      onCloseKPI(item.id);
    } else if (onViewDetail) {
      onViewDetail(item.id);
    }
  };

  return (
    <Card style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11,
          background: config.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Icon name={config.icon} size={22} color={config.color} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.dark, display: "inline-flex", alignItems: "center", gap: 6 }}>
              {unit && <Icon name={unit.icon} size={14} color={unit.color} />}{sub?.name} · {template?.name}
            </span>
            <Pill color={config.color} bg={config.bg}>{item.period}</Pill>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>
            Diajukan oleh <strong>{submitter?.name}</strong> pada {formatDate(item.createdAt)}
            {item.approvedAt && <> • Disetujui {formatDate(item.approvedAt)}</>}
          </div>
        </div>
        <Button
          variant={config.actionVariant}
          size="sm"
          onClick={handleClick}
        >
          {config.action}
        </Button>
      </div>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Audit Log Page
// ──────────────────────────────────────────────────────────────────────────

/**
 * Activity log filtered by user role.
 */
function AuditLogPage({ user }) {
  const entries = useMemo(() => getAuditLogForUser(user), [user]);
  const [filterActor, setFilterActor] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");

  const filtered = entries.filter(e => {
    if (filterActor !== "all" && e.actorId !== filterActor) return false;
    if (filterAction !== "all" && e.action !== filterAction) return false;
    if (filterEntity !== "all" && e.entityType !== filterEntity) return false;
    return true;
  });

  // Sort by timestamp desc
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const visibleActors = Array.from(new Set(entries.map(e => e.actorId)));
  const visibleActions = Array.from(new Set(entries.map(e => e.action)));
  const visibleEntities = Array.from(new Set(entries.map(e => e.entityType)));

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 14px" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: COLORS.dark, margin: 0 }}>Audit Log
        </h1>
        <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "4px 0 0" }}>
          {entries.length} aktivitas tercatat • Tampilan {user.role === ROLES.OWNER ? "semua unit" : "unit Anda saja"}
        </p>
      </div>

      <Card style={{ padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
            Filter:
          </span>
          <select value={filterActor} onChange={e => setFilterActor(e.target.value)} style={selectStyle}>
            <option value="all">Semua Pelaku</option>
            {visibleActors.map(aid => {
              const u = getUser(aid);
              return <option key={aid} value={aid}>{u?.name}</option>;
            })}
          </select>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={selectStyle}>
            <option value="all">Semua Aksi</option>
            {visibleActions.map(a => (
              <option key={a} value={a}>{getAuditActionInfo(a).label}</option>
            ))}
          </select>
          <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)} style={selectStyle}>
            <option value="all">Semua Tipe</option>
            {visibleEntities.map(e => (
              <option key={e} value={e}>{e.replace("_", " ")}</option>
            ))}
          </select>
          <div style={{ marginLeft: "auto", fontSize: 11, color: COLORS.textMuted }}>
            {filtered.length} dari {entries.length}
          </div>
        </div>
      </Card>

      <Card style={{ padding: 0 }}>
        {sorted.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: COLORS.textLight, fontSize: 12 }}>
            Tidak ada aktivitas yang sesuai filter
          </div>
        ) : (
          sorted.map((entry, i) => (
            <AuditLogRow
              key={entry.id}
              entry={entry}
              isLast={i === sorted.length - 1}
            />
          ))
        )}
      </Card>
    </div>
  );
}

function AuditLogRow({ entry, isLast }) {
  const actor = getUser(entry.actorId);
  const unit = UNITS[entry.unitId];
  const action = getAuditActionInfo(entry.action);

  return (
    <div style={{
      padding: "12px 16px",
      borderBottom: isLast ? "none" : `1px solid ${COLORS.bgMuted}`,
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: action.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}><Icon name={action.icon} size={15} color={action.color} /></div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark }}>
            {actor?.name}
          </span>
          <Pill color={action.color} bg={action.bg}>{action.label}</Pill>
          {unit && <Pill color={unit.color} bg={unit.colorLight}>{unit.name}</Pill>}
        </div>
        <div style={{ fontSize: 12, color: COLORS.text }}>{entry.entityLabel}</div>
        {entry.details && (
          <div style={{
            fontSize: 11,
            color: COLORS.textMuted,
            marginTop: 4,
            padding: "5px 8px",
            background: "#FAFBFC",
            borderRadius: 5,
            fontStyle: "italic",
          }}>{entry.details}
          </div>
        )}
        {entry.diff && (
          <div style={{
            fontSize: 11,
            marginTop: 4,
            padding: "5px 8px",
            background: "#FFFBEB",
            borderRadius: 5,
            color: "#92400E",
          }}>
            <span style={{ textDecoration: "line-through", opacity: 0.7 }}>{entry.diff.before}</span>
            {" → "}
            <strong>{entry.diff.after}</strong>
          </div>
        )}
      </div>

      <div style={{
        textAlign: "right",
        fontSize: 10,
        color: COLORS.textLight,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}>
        {formatDateTime(entry.timestamp)}
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// §8.6  FORM PAGES (Submit, Close, Update, Add Expense)
// ════════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────
// Form helper components
// ──────────────────────────────────────────────────────────────────────────

function FormPageWrapper({ title, subtitle, onBack, children }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 14px" }}>
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: COLORS.textMuted,
          cursor: "pointer",
          fontSize: 12,
          padding: "4px 0 12px",
          fontFamily: "inherit",
        }}
      >
        ← Kembali
      </button>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: COLORS.dark, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function FormFieldInput({ field, value, onChange, disabled, computedValue }) {
  const isAuto = field.type === "auto";
  const displayValue = isAuto ? computedValue : value;

  // Decide if this numeric field should show thousand separators.
  // Decimals (FCR "x") and percentages are left as plain numbers.
  const useThousandSep = field.type === "number" && field.satuan !== "x" && field.satuan !== "%";

  // For separated inputs we render a text box and format/parse manually.
  const renderSeparatedInput = () => {
    const formatted = (value === undefined || value === null || value === "")
      ? ""
      : Number(value).toLocaleString("id-ID");
    return (
      <input
        type="text"
        inputMode="numeric"
        value={formatted}
        onChange={e => {
          // Strip non-digits, parse back to a plain number
          const raw = e.target.value.replace(/[^\d]/g, "");
          onChange(raw === "" ? "" : Number(raw));
        }}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "9px 12px",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "inherit",
          background: disabled ? "#F1F5F9" : COLORS.white,
          color: COLORS.dark,
          boxSizing: "border-box",
        }}
      />
    );
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
      }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark }}>
          {isAuto && ""}{field.name}
          {field.satuan && <span style={{ color: COLORS.textMuted, fontWeight: 400, marginLeft: 4 }}>({field.satuan})</span>}
          {field.isMargin && (
            <span style={{ marginLeft: 6 }}>
              <Pill color={COLORS.success} bg={COLORS.successBg}>Margin</Pill>
            </span>
          )}
        </label>
        {isAuto && (
          <span style={{ fontSize: 10, color: COLORS.primaryDark, fontFamily: "monospace" }}>
            {getFormula(field.formulaId)?.formula}
          </span>
        )}
      </div>

      {isAuto ? (
        <div style={{
          padding: "9px 12px",
          background: COLORS.infoBg,
          border: "1px solid #C5DBF0",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 700,
          color: COLORS.primaryDark,
          fontFamily: "monospace",
        }}>
          {formatFieldValue(displayValue, field.satuan, field.type)}
        </div>
      ) : useThousandSep ? (
        renderSeparatedInput()
      ) : (
        <input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          value={value ?? ""}
          onChange={e => onChange(field.type === "number" ? Number(e.target.value) || 0 : e.target.value)}
          disabled={disabled}
          step={field.type === "number" ? "any" : undefined}
          style={{
            width: "100%",
            padding: "9px 12px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "inherit",
            background: disabled ? "#F1F5F9" : COLORS.white,
            color: COLORS.dark,
            boxSizing: "border-box",
          }}
        />
      )}

      <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 3 }}>
        Sumber: {field.source}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Form 1: Submit KPI (Ajukan KPI Baru)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Form for PIC/Leader to submit a new KPI estimation.
 * Step 1: Pick template
 * Step 2: Fill estimation values
 * Step 3: Submit
 */
function SubmitKPIForm({ user, context, onBack }) {
  const store = useDataStore();
  const subUnitId = context?.subUnitId || user.subUnitId;
  const subUnit = LIVE.subUnits.find(s => s.id === subUnitId);
  const parentUnit = subUnit ? UNITS[subUnit.unitId] : null;

  const [step, setStep] = useState(1); // 1: pick template, 2: fill values
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [period, setPeriod] = useState("");
  const [values, setValues] = useState({});
  const [expectedCloseAt, setExpectedCloseAt] = useState("");

  const template = selectedTemplateId ? getFormTemplate(selectedTemplateId) : null;

  // Compute auto-calculated values
  const computedValues = useMemo(() => {
    if (!template) return {};
    return computeFieldValues(template, values);
  }, [template, values]);

  if (!subUnit || !parentUnit) {
    return (
      <FormPageWrapper title="Ajukan KPI Baru" onBack={onBack}>
        <Card style={{ padding: 20, textAlign: "center", color: COLORS.textMuted }}>
          Sub unit tidak ditemukan
        </Card>
      </FormPageWrapper>
    );
  }

  const handleSubmit = async () => {
    if (!template) {
      alert("Pilih template dulu");
      return;
    }
    if (!period) {
      alert("Isi periode KPI");
      return;
    }
    if (!expectedCloseAt) {
      alert("Tentukan tanggal closing yang diharapkan");
      return;
    }
    // Validate at least manual fields filled
    const manualFields = template.fields.filter(f => f.type !== "auto");
    const emptyManual = manualFields.filter(f => values[f.id] === undefined || values[f.id] === "" || values[f.id] === null);
    if (emptyManual.length > 0) {
      const confirmSubmit = confirm(
        `Ada ${emptyManual.length} field belum diisi:\n${emptyManual.slice(0, 5).map(f => "• " + f.name).join("\n")}${emptyManual.length > 5 ? "\n..." : ""}\n\nLanjut submit?`
      );
      if (!confirmSubmit) return;
    }

    // Simpan ke database (status: estimated = menunggu approval), lalu segarkan store.
    try {
      await createSubmission({
        templateId: template.id,
        subUnitId: subUnit.id,
        period,
        estimatedValues: { ...values },
        subUnitWeight: subUnit.id in LIVE.subUnitWeights ? LIVE.subUnitWeights[subUnit.id] : 50,
      });
      if (store) store.setSubmissions(await fetchSubmissions());
    } catch (e) {
      alert(e.message || "Gagal mengajukan KPI.");
      return;
    }

    alert(
      `KPI berhasil diajukan!\n\n` +
      `Sub Unit: ${subUnit.name}\n` +
      `Template: ${template.name}\n` +
      `Periode: ${period}\n` +
      `Estimasi closing: ${expectedCloseAt}\n\n` +
      `Status: Menunggu approval Owner.\n` +
      `KPI ini sekarang muncul di menu KPI & Inbox approval.`
    );
    onBack();
  };

  return (
    <FormPageWrapper
      title="Ajukan KPI Baru"
      subtitle={`Sub Unit: ${subUnit.name} • ${parentUnit.name}`}
      onBack={onBack}
    >
      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <StepBadge num={1} label="Pilih Template" active={step === 1} done={step > 1} onClick={() => setStep(1)} />
        <StepBadge num={2} label="Isi Estimasi" active={step === 2} done={false} onClick={() => template && setStep(2)} />
      </div>

      {/* Step 1: pick template */}
      {step === 1 && (
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 12 }}>
            Pilih Template Form KPI
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {LIVE.templates.map(t => {
              const FREQ_LABELS = {
                monthly: "Bulanan",
                cycle: "Per Siklus",
                event: "Per Event",
              };
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  style={{
                    padding: "12px 14px",
                    border: `2px solid ${selectedTemplateId === t.id ? COLORS.primary : COLORS.border}`,
                    borderRadius: 10,
                    background: selectedTemplateId === t.id ? COLORS.infoBg : COLORS.white,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>
                        {t.description}
                      </div>
                      <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 4 }}>
                        {t.fields.length} field • {FREQ_LABELS[t.frequency]}
                      </div>
                    </div>
                    {selectedTemplateId === t.id && (
                      <span style={{ fontSize: 20, color: COLORS.primary }}></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>
              {template ? `Template "${template.name}" dipilih` : "Pilih salah satu template dulu untuk lanjut"}
            </span>
            <Button
              variant="primary"
              onClick={() => template && setStep(2)}
              disabled={!template}
            >
              Lanjut: Isi Estimasi →
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: fill values */}
      {step === 2 && template && (
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark }}>
                Isi Estimasi: {template.name}
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                Field auto-calculate akan terhitung otomatis dari input lain
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>← Ganti Template</Button>
          </div>

          {/* Period & expected close */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark, display: "block", marginBottom: 5 }}>
                Periode <span style={{ color: COLORS.danger }}>*</span>
              </label>
              <input
                type="text"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                placeholder={template.frequency === "monthly" ? "Mei 2026" : "Siklus Mei-Agu 2026"}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark, display: "block", marginBottom: 5 }}>
                Estimasi Tanggal Closing <span style={{ color: COLORS.danger }}>*</span>
              </label>
              <input
                type="date"
                value={expectedCloseAt}
                onChange={e => setExpectedCloseAt(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Fields */}
          <div style={{ borderTop: `1px solid ${COLORS.bgMuted}`, paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.dark, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Input Estimasi Target
            </div>
            {template.fields.map(field => (
              <FormFieldInput
                key={field.id}
                field={field}
                value={values[field.id]}
                onChange={(val) => setValues({ ...values, [field.id]: val })}
                computedValue={computedValues[field.name]}
              />
            ))}
          </div>

          {/* Info banner */}
          <InfoBanner icon="info" variant="info">
            Setelah submit, KPI akan menunggu approval Owner. Bapak boleh mulai operasional sambil menunggu — approval menyusul.
          </InfoBanner>

          {/* Actions */}
          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}>
            <button
              onClick={onBack}
              style={{
                padding: "10px 18px",
                background: COLORS.white,
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              style={{
                padding: "12px 28px",
                background: COLORS.success,
                color: COLORS.white,
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 2px 8px rgba(5,150,105,0.3)",
              }}
            >
              Simpan & Ajukan KPI
            </button>
          </div>
        </Card>
      )}
    </FormPageWrapper>
  );
}

function StepBadge({ num, label, active, done, onClick }) {
  const color = done ? COLORS.success : active ? COLORS.primary : COLORS.textLight;
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 14px",
        border: `2px solid ${color}`,
        borderRadius: 8,
        background: active ? COLORS.infoBg : done ? COLORS.successBg : COLORS.white,
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: "50%",
        background: color, color: COLORS.white,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800,
      }}>
        {done ? "" : num}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: color }}>{label}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Form 2: Close KPI (Tutup KPI dengan realisasi)
// ──────────────────────────────────────────────────────────────────────────

function CloseKPIForm({ user, context, onBack }) {
  const store = useDataStore();
  const submission = LIVE.submissions.find(s => s.id === context?.submissionId);
  const template = submission ? getFormTemplate(submission.templateId) : null;
  const subUnit = submission ? LIVE.subUnits.find(s => s.id === submission.subUnitId) : null;
  const parentUnit = subUnit ? UNITS[subUnit.unitId] : null;

  const [actualValues, setActualValues] = useState({});
  const [closingNote, setClosingNote] = useState("");

  // Pre-fill manual fields with estimated values as starting point
  useEffect(() => {
    if (submission && template) {
      const init = {};
      template.fields.forEach(f => {
        if (f.type !== "auto" && submission.estimatedValues[f.id] !== undefined) {
          init[f.id] = submission.estimatedValues[f.id];
        }
      });
      setActualValues(init);
    }
  }, [submission?.id]);

  const computedActual = useMemo(() => {
    if (!template) return {};
    return computeFieldValues(template, actualValues);
  }, [template, actualValues]);

  const computedEstimated = useMemo(() => {
    if (!template || !submission) return {};
    return computeFieldValues(template, submission.estimatedValues);
  }, [template, submission?.id]);

  if (!submission || !template) {
    return (
      <FormPageWrapper title="Tutup KPI" onBack={onBack}>
        <Card style={{ padding: 20, textAlign: "center", color: COLORS.textMuted }}>
          Submission tidak ditemukan
        </Card>
      </FormPageWrapper>
    );
  }

  const handleClose = async () => {
    if (!closingNote.trim() || closingNote.trim().length < 10) {
      alert("Catatan/alasan WAJIB diisi (minimal 10 karakter).\nJelaskan kondisi closing, kendala, atau hal penting periode ini.");
      return;
    }
    // Simpan closing ke database (realisasi + catatan), lalu segarkan store.
    try {
      await closeSubmission(submission.id, {
        actualValues: { ...actualValues },
        closingNote: closingNote.trim(),
      });
      if (store) store.setSubmissions(await fetchSubmissions());
    } catch (e) {
      alert(e.message || "Gagal menutup KPI.");
      return;
    }
    alert(
      `KPI berhasil ditutup!\n\n` +
      `Sub Unit: ${subUnit.name}\n` +
      `Periode: ${submission.period}\n` +
      `Catatan: "${closingNote}"\n\n` +
      `Realisasi tercatat. Skor KPI dihitung otomatis & muncul di dashboard periode ini.`
    );
    onBack();
  };

  return (
    <FormPageWrapper
      title="Tutup KPI"
      subtitle={`${subUnit.name} • ${template.name} • ${submission.period}`}
      onBack={onBack}
    >
      <Card style={{ padding: "16px 18px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: COLORS.primaryDark, marginBottom: 6, fontWeight: 700 }}>
          Cara mengisi
        </div>
        <div style={{ fontSize: 11, color: COLORS.primaryDark, lineHeight: 1.5 }}>
          Kolom <strong>Estimasi</strong> (kiri) = nilai target yang Bapak ajukan di awal.
          Kolom <strong>Realisasi</strong> (kanan) = nilai sebenarnya yang terjadi.
          Field auto-calculate akan terhitung sendiri saat Bapak isi field manual.
        </div>
      </Card>

      <Card style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 14 }}>Isi Realisasi
        </div>

        {template.fields.map(field => {
          const estVal = field.type === "auto"
            ? computedEstimated[field.name]
            : submission.estimatedValues[field.id];
          const actVal = actualValues[field.id];
          const isAuto = field.type === "auto";

          return (
            <div
              key={field.id}
              style={{
                padding: "12px 14px",
                background: "#FAFBFC",
                border: `1px solid ${COLORS.bgMuted}`,
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.dark,
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span>
                  {isAuto && ""}{field.name}
                  {field.satuan && <span style={{ color: COLORS.textMuted, fontWeight: 400, marginLeft: 4 }}>({field.satuan})</span>}
                  {field.isMargin && (
                    <span style={{ marginLeft: 6 }}>
                      <Pill color={COLORS.success} bg={COLORS.successBg}>Margin</Pill>
                    </span>
                  )}
                </span>
                {isAuto && (
                  <span style={{ fontSize: 10, color: COLORS.primaryDark, fontFamily: "monospace" }}>
                    {getFormula(field.formulaId)?.formula}
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: COLORS.textLight, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                    Estimasi
                  </div>
                  <div style={{
                    padding: "8px 11px",
                    background: COLORS.white,
                    border: `1px solid ${COLORS.bgMuted}`,
                    borderRadius: 7,
                    fontSize: 13,
                    color: COLORS.textMuted,
                  }}>
                    {formatFieldValue(estVal, field.satuan, field.type)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: COLORS.success, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                    Realisasi *
                  </div>
                  {isAuto ? (
                    <div style={{
                      padding: "8px 11px",
                      background: COLORS.infoBg,
                      border: "1px solid #C5DBF0",
                      borderRadius: 7,
                      fontSize: 13,
                      fontWeight: 700,
                      color: COLORS.primaryDark,
                    }}>
                      {formatFieldValue(computedActual[field.name], field.satuan, field.type)}
                    </div>
                  ) : (field.satuan !== "x" && field.satuan !== "%" && field.type === "number") ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={(actVal === undefined || actVal === null || actVal === "")
                        ? ""
                        : Number(actVal).toLocaleString("id-ID")}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^\d]/g, "");
                        setActualValues({
                          ...actualValues,
                          [field.id]: raw === "" ? "" : Number(raw)
                        });
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 11px",
                        border: `1px solid ${COLORS.success}`,
                        borderRadius: 7,
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "inherit",
                        color: COLORS.dark,
                        boxSizing: "border-box",
                      }}
                    />
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                      value={actVal ?? ""}
                      onChange={e => setActualValues({
                        ...actualValues,
                        [field.id]: field.type === "number" ? Number(e.target.value) || 0 : e.target.value
                      })}
                      step={field.type === "number" ? "any" : undefined}
                      style={{
                        width: "100%",
                        padding: "8px 11px",
                        border: `1px solid ${COLORS.success}`,
                        borderRadius: 7,
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "inherit",
                        color: COLORS.dark,
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Mandatory closing note */}
        <div style={{
          marginTop: 16,
          padding: "14px 16px",
          background: "#FEF3C7",
          border: "1px solid #FCD34D",
          borderRadius: 10,
        }}>
          <label style={{
            display: "block",
            fontSize: 12,
            fontWeight: 800,
            color: "#92400E",
            marginBottom: 6,
          }}>Catatan / Alasan Closing <span style={{ color: COLORS.danger }}>*WAJIB</span>
          </label>
          <div style={{ fontSize: 10, color: "#78350F", marginBottom: 8 }}>
            Minimal 10 karakter. Ceritakan: kendala, hal penting, atau alasan jika ada selisih besar antara estimasi dan realisasi.
          </div>
          <textarea
            value={closingNote}
            onChange={e => setClosingNote(e.target.value)}
            rows={3}
            placeholder="Contoh: Panen H+105. SR di bawah target karena suhu malam turun di minggu ke-8. FCR sedikit naik karena pakan baru sedang trial..."
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 7,
              fontSize: 12,
              fontFamily: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <div style={{
            marginTop: 5,
            fontSize: 10,
            color: closingNote.length < 10 ? COLORS.danger : COLORS.success,
            fontWeight: 600,
          }}>
            {closingNote.length}/10 karakter {closingNote.length >= 10 && ""}
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
          <Button variant="secondary" onClick={onBack}>Batal</Button>
          <Button variant="success" onClick={handleClose}>Konfirmasi Closing KPI</Button>
        </div>
      </Card>
    </FormPageWrapper>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Form 3: Update Monthly KPI (realtime update untuk KPI bulanan)
// ──────────────────────────────────────────────────────────────────────────

function UpdateMonthlyKPIForm({ user, context, onBack }) {
  const store = useDataStore();
  const submission = LIVE.submissions.find(s => s.id === context?.submissionId);
  const template = submission ? getFormTemplate(submission.templateId) : null;
  const subUnit = submission ? LIVE.subUnits.find(s => s.id === submission.subUnitId) : null;

  const [actualValues, setActualValues] = useState({});

  useEffect(() => {
    if (submission && template) {
      const init = {};
      template.fields.forEach(f => {
        if (f.type !== "auto") {
          // Use existing actual if present, otherwise estimated
          init[f.id] = (submission.actualValues && submission.actualValues[f.id] !== undefined)
            ? submission.actualValues[f.id]
            : (submission.estimatedValues[f.id] || 0);
        }
      });
      setActualValues(init);
    }
  }, [submission?.id]);

  const computedActual = useMemo(() => {
    if (!template) return {};
    return computeFieldValues(template, actualValues);
  }, [template, actualValues]);

  if (!submission || !template) {
    return (
      <FormPageWrapper title="Update KPI" onBack={onBack}>
        <Card style={{ padding: 20, textAlign: "center", color: COLORS.textMuted }}>
          Submission tidak ditemukan
        </Card>
      </FormPageWrapper>
    );
  }

  const handleUpdate = async () => {
    // Simpan realisasi terbaru ke database (status tetap), lalu segarkan store.
    try {
      await updateSubmissionActual(submission.id, { actualValues: { ...actualValues } });
      if (store) store.setSubmissions(await fetchSubmissions());
    } catch (e) {
      alert(e.message || "Gagal memperbarui KPI.");
      return;
    }
    alert(
      `KPI berhasil di-update!\n\n` +
      `Sub Unit: ${subUnit.name}\n` +
      `Periode: ${submission.period}\n\n` +
      `Realisasi terbaru tersimpan. Dashboard & menu KPI reflect data terbaru.`
    );
    onBack();
  };

  return (
    <FormPageWrapper
      title="Update KPI Bulanan"
      subtitle={`${subUnit.name} • ${template.name} • ${submission.period}`}
      onBack={onBack}
    >
      <Card style={{ padding: "16px 18px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: COLORS.primaryDark, lineHeight: 1.5 }}>
          KPI bulanan boleh di-update kapan saja sepanjang bulan. Setiap update tercatat di Audit Log.
          Update terakhir akan jadi nilai final saat closing akhir bulan.
        </div>
      </Card>

      <Card style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 14 }}>Update Nilai Realisasi
        </div>

        {template.fields.map(field => (
          <FormFieldInput
            key={field.id}
            field={field}
            value={actualValues[field.id]}
            onChange={(val) => setActualValues({ ...actualValues, [field.id]: val })}
            computedValue={computedActual[field.name]}
          />
        ))}

        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
          <Button variant="secondary" onClick={onBack}>Batal</Button>
          <Button variant="primary" onClick={handleUpdate}>Simpan Update</Button>
        </div>
      </Card>
    </FormPageWrapper>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Form 4: Add Expense (Project expense + bukti)
// ──────────────────────────────────────────────────────────────────────────

function AddExpenseForm({ user, context, onBack }) {
  const project = LIVE.projects.find(p => p.id === context?.projectId);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [linkedMilestoneId, setLinkedMilestoneId] = useState(context?.milestoneId || "");
  const [hasFile, setHasFile] = useState(false);
  const [notes, setNotes] = useState("");

  if (!project) {
    return (
      <FormPageWrapper title="Tambah Expense" onBack={onBack}>
        <Card style={{ padding: 20, textAlign: "center", color: COLORS.textMuted }}>
          Project tidak ditemukan
        </Card>
      </FormPageWrapper>
    );
  }

  const unit = UNITS[project.unitId];

  const handleSubmit = () => {
    if (!name.trim()) { alert("Nama expense wajib diisi"); return; }
    if (amount <= 0) { alert("Nominal harus lebih dari 0"); return; }
    if (!hasFile) { alert("Bukti pembelian WAJIB diupload (nota/invoice/struk)"); return; }

    alert(
      `Expense berhasil dicatat!\n\n` +
      `Project: ${project.name}\n` +
      `Item: ${name}\n` +
      `Nominal: ${formatRupiah(amount)}\n` +
      `Tanggal: ${date}\n` +
      `Bukti: Terlampir\n` +
      (linkedMilestoneId ? `Milestone: ${linkedMilestoneId}\n` : "") +
      `\nSudah masuk ke total spent project.`
    );
    onBack();
  };

  return (
    <FormPageWrapper
      title="Tambah Expense Project"
      subtitle={`${project.name} • ${unit.name}`}
      onBack={onBack}
    >
      <Card style={{ padding: "16px 18px", marginBottom: 14, background: COLORS.infoBg, border: "1px solid #C5DBF0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: COLORS.primaryDark }}>Budget Project:</span>
          <span style={{ fontWeight: 700, color: COLORS.primaryDark }}>{formatRupiah(project.budgetPlanned)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 5 }}>
          <span style={{ color: COLORS.primaryDark }}>Sudah terpakai:</span>
          <span style={{ fontWeight: 700, color: COLORS.primaryDark }}>
            {formatRupiah(project.budgetSpent)} ({Math.round((project.budgetSpent / project.budgetPlanned) * 100)}%)
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 5, paddingTop: 6, borderTop: "1px solid #C5DBF0" }}>
          <span style={{ color: COLORS.primaryDark }}>Sisa budget:</span>
          <span style={{ fontWeight: 800, color: COLORS.success }}>
            {formatRupiah(project.budgetPlanned - project.budgetSpent)}
          </span>
        </div>
      </Card>

      <Card style={{ padding: "16px 18px" }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark, display: "block", marginBottom: 5 }}>
            Nama Item / Deskripsi <span style={{ color: COLORS.danger }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Contoh: Beli batu kali 5 truk, Bayar tukang H1-H7..."
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark, display: "block", marginBottom: 5 }}>
              Nominal (Rp) <span style={{ color: COLORS.danger }}>*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Number(e.target.value) || 0)}
              placeholder="0"
              style={inputStyle}
            />
            {amount > 0 && (
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 3 }}>
                = {formatRupiah(amount)}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark, display: "block", marginBottom: 5 }}>
              Tanggal Pengeluaran <span style={{ color: COLORS.danger }}>*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark, display: "block", marginBottom: 5 }}>
            Hubungkan ke Milestone (opsional)
          </label>
          <select
            value={linkedMilestoneId}
            onChange={e => setLinkedMilestoneId(e.target.value)}
            style={inputStyle}
          >
            <option value="">— Project-level (tidak terkait milestone spesifik) —</option>
            {/* Mock milestones */}
            <option value="ms-1">Milestone 1: Persiapan lahan</option>
            <option value="ms-2">Milestone 2: Konstruksi</option>
            <option value="ms-3">Milestone 3: Instalasi sistem</option>
            <option value="ms-4">Milestone 4: Uji coba</option>
          </select>
        </div>

        <div style={{
          marginBottom: 12,
          padding: "14px 16px",
          background: hasFile ? COLORS.successBg : COLORS.warningBg,
          border: `2px dashed ${hasFile ? COLORS.success : COLORS.warning}`,
          borderRadius: 10,
        }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: hasFile ? "#065F46" : "#92400E", display: "block", marginBottom: 6 }}>Bukti Pembelian <span style={{ color: COLORS.danger }}>*WAJIB</span>
          </label>
          <div style={{ fontSize: 10, color: hasFile ? "#065F46" : "#78350F", marginBottom: 8 }}>
            Upload foto nota, invoice, atau struk pembelian. Format: JPG, PNG, atau PDF.
          </div>
          {hasFile ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, padding: "8px 12px", background: COLORS.white, borderRadius: 6, fontSize: 12, color: COLORS.success, fontWeight: 600 }}>nota_pembelian_001.jpg (2.3 MB)
              </div>
              <Button variant="ghost" size="sm" onClick={() => setHasFile(false)}>Ganti</Button>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setHasFile(true)}>Pilih File Bukti
            </Button>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark, display: "block", marginBottom: 5 }}>
            Catatan tambahan (opsional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Konteks tambahan jika perlu..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button variant="secondary" onClick={onBack}>Batal</Button>
          <Button variant="success" onClick={handleSubmit}>Simpan Expense</Button>
        </div>
      </Card>
    </FormPageWrapper>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "inherit",
  background: COLORS.white,
  color: COLORS.dark,
  boxSizing: "border-box",
};

// ──────────────────────────────────────────────────────────────────────────
// Form 5: Submit Project (Ajukan Project Baru)
// Leader/PIC mengajukan project baru → menunggu approval Owner.
// ──────────────────────────────────────────────────────────────────────────

/**
 * Form for Leader/PIC to propose a new project.
 * A project adds/changes an asset or structure (new pond, brand, branch, software)
 * and requires Owner approval before work begins.
 */
function SubmitProjectForm({ user, context, onBack }) {
  const store = useDataStore();
  // Determine which units/sub-units this user may propose a project for
  const availableUnits = useMemo(() => {
    if (user.role === ROLES.LEADER) return [UNITS[user.unitId]];
    if (user.role === ROLES.PIC) {
      const sub = LIVE.subUnits.find(s => s.id === user.subUnitId);
      return sub ? [UNITS[sub.unitId]] : [];
    }
    return Object.values(UNITS);
  }, [user]);

  const [unitId, setUnitId] = useState(
    context?.unitId || (availableUnits[0] ? availableUnits[0].id : "")
  );
  const [subUnitId, setSubUnitId] = useState(context?.subUnitId || "");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [budgetPlanned, setBudgetPlanned] = useState("");
  const [milestones, setMilestones] = useState([
    { key: 1, name: "", date: "", pic: "", budget: "" },
  ]);
  const [milestoneKeyCounter, setMilestoneKeyCounter] = useState(2);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [convertToSubUnit, setConvertToSubUnit] = useState(false);

  const subUnitOptions = LIVE.subUnits.filter(s => s.unitId === unitId);
  const unit = unitId ? UNITS[unitId] : null;

  const addMilestone = () => {
    setMilestones([...milestones, { key: milestoneKeyCounter, name: "", date: "", pic: "", budget: "" }]);
    setMilestoneKeyCounter(milestoneKeyCounter + 1);
  };

  const removeMilestone = (key) => {
    if (milestones.length === 1) {
      alert("Project minimal punya 1 milestone");
      return;
    }
    setMilestones(milestones.filter(m => m.key !== key));
  };

  const updateMilestone = (key, field, value) => {
    setMilestones(milestones.map(m => m.key === key ? { ...m, [field]: value } : m));
  };

  const handleSubmit = () => {
    if (!unitId)      { alert("Pilih unit dulu"); return; }
    if (!name.trim()) { alert("Isi nama project"); return; }
    if (!desc.trim()) { alert("Isi deskripsi project"); return; }
    if (!budgetPlanned) { alert("Isi estimasi budget"); return; }
    if (!startDate || !endDate) { alert("Isi tanggal mulai & target selesai"); return; }
    if (new Date(endDate) < new Date(startDate)) {
      alert("Target selesai tidak boleh lebih awal dari tanggal mulai"); return;
    }
    // Milestones validation
    const incompleteMs = milestones.find(m => !m.name.trim() || !m.date);
    if (incompleteMs) {
      alert("Setiap milestone wajib punya nama dan tanggal target"); return;
    }

    const msList = milestones
      .map((m, i) => {
        const b = m.budget ? formatRupiahFull(Number(m.budget)) : "belum dialokasi";
        return `  ${i + 1}. ${m.name} — ${m.date} — ${b}${m.pic ? ` (PIC: ${m.pic})` : ""}`;
      })
      .join("\n");
    const totalAlloc = milestones.reduce((sum, m) => sum + (Number(m.budget) || 0), 0);

    // Write the new project + its milestones to the store
    const projectId = `pj-${Date.now()}`;
    const newProject = {
      id: projectId,
      name: name.trim(),
      unitId,
      subUnitId: subUnitId || null,
      description: desc.trim(),
      status: "pending_approval",
      budgetPlanned: Number(budgetPlanned),
      budgetSpent: 0,
      milestonesTotal: milestones.length,
      milestonesDone: 0,
      startDate,
      endDate,
    };
    const newMilestones = milestones.map((m, i) => ({
      id: `${projectId}-ms${i + 1}`,
      name: m.name.trim(),
      done: false,
      date: m.date,
      pic: m.pic || "",
      budgetAllocated: Number(m.budget) || 0,
    }));
    if (store) {
      store.setProjects(prev => [...prev, newProject]);
      store.setMilestones(prev => ({ ...prev, [projectId]: newMilestones }));
    }

    alert(
      "Project berhasil diajukan.\n\n" +
      `Unit: ${unit.name}\n` +
      (subUnitId ? `Sub Unit: ${getSubUnitName(subUnitId)}\n` : "Cakupan: Level Unit\n") +
      `Nama: ${name}\n` +
      `Estimasi Budget: ${formatRupiahFull(Number(budgetPlanned))}\n` +
      `Periode: ${startDate} s/d ${endDate}\n` +
      `\nMilestone (${milestones.length}):\n${msList}\n` +
      `\nTotal alokasi milestone: ${formatRupiahFull(totalAlloc)}\n` +
      (convertToSubUnit ? "\nProject ini akan otomatis menjadi Sub Unit baru saat selesai.\n" : "") +
      "\nStatus: Menunggu approval Owner. Project sekarang muncul di daftar Project & dashboard."
    );
    onBack();
  };

  return (
    <FormPageWrapper
      title="Ajukan Project Baru"
      subtitle="Project akan menunggu persetujuan Owner sebelum dimulai"
      onBack={onBack}
    >
      <Card style={{ padding: "16px 18px" }}>
        <InfoBanner icon="project" variant="info">
          Project adalah inisiatif yang menambah atau mengubah aset/struktur bisnis — misalnya kolam baru, cabang baru, brand baru, atau software. Berbeda dengan KPI yang mengukur operasional rutin.
        </InfoBanner>

        {/* Unit & Sub Unit */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Unit <span style={{ color: COLORS.danger }}>*</span></label>
            <select
              value={unitId}
              onChange={e => { setUnitId(e.target.value); setSubUnitId(""); }}
              style={inputStyle}
              disabled={availableUnits.length === 1}
            >
              {availableUnits.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Sub Unit (opsional)</label>
            <select
              value={subUnitId}
              onChange={e => setSubUnitId(e.target.value)}
              style={inputStyle}
              disabled={user.role === ROLES.PIC}
            >
              <option value="">— Level Unit (tanpa sub unit) —</option>
              {subUnitOptions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Nama Project <span style={{ color: COLORS.danger }}>*</span></label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="cth: Pembukaan Kolam Cerelek 2"
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Deskripsi & Tujuan <span style={{ color: COLORS.danger }}>*</span></label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={3}
            placeholder="Jelaskan ruang lingkup, tujuan, dan hasil yang diharapkan dari project ini..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {/* Budget & milestones */}
        {/* Budget */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Estimasi Budget (Rp) <span style={{ color: COLORS.danger }}>*</span></label>
          <input
            type="text"
            inputMode="numeric"
            value={budgetPlanned === "" ? "" : Number(budgetPlanned).toLocaleString("id-ID")}
            onChange={e => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              setBudgetPlanned(raw === "" ? "" : Number(raw));
            }}
            placeholder="cth: 180.000.000"
            style={inputStyle}
          />
        </div>

        {/* Dates */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Tanggal Mulai <span style={{ color: COLORS.danger }}>*</span></label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Target Selesai <span style={{ color: COLORS.danger }}>*</span></label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Milestone list — dynamic */}
        <div style={{
          marginBottom: 16,
          padding: "14px 14px 12px",
          background: COLORS.bgMuted,
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.dark }}>
                Daftar Milestone <span style={{ color: COLORS.danger }}>*</span>
              </div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>
                {milestones.length} milestone • Bisa diubah/ditambah di Project Detail setelah disetujui
              </div>
            </div>
            <button
              onClick={addMilestone}
              type="button"
              style={{
                padding: "7px 12px",
                background: COLORS.white,
                color: COLORS.primary,
                border: `1px solid ${COLORS.primary}`,
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Icon name="plus" size={13} color={COLORS.primary} />
              Tambah Milestone
            </button>
          </div>

          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "24px 1fr 120px 130px 110px 28px",
            gap: 6,
            padding: "0 2px 6px",
            fontSize: 10,
            fontWeight: 700,
            color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}>
            <div>#</div>
            <div>Nama Milestone</div>
            <div>Target Tanggal</div>
            <div>Alokasi Budget</div>
            <div>PIC</div>
            <div></div>
          </div>

          {/* Milestone rows */}
          {milestones.map((m, idx) => (
            <div
              key={m.key}
              style={{
                display: "grid",
                gridTemplateColumns: "24px 1fr 120px 130px 110px 28px",
                gap: 6,
                padding: "5px 2px",
                alignItems: "center",
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: 99,
                background: COLORS.white,
                border: `1px solid ${COLORS.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, color: COLORS.textMuted,
              }}>{idx + 1}</div>
              <input
                type="text"
                value={m.name}
                onChange={e => updateMilestone(m.key, "name", e.target.value)}
                placeholder="cth: Survey & izin lahan"
                style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }}
              />
              <input
                type="date"
                value={m.date}
                onChange={e => updateMilestone(m.key, "date", e.target.value)}
                style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }}
              />
              <input
                type="text"
                inputMode="numeric"
                value={m.budget === "" ? "" : Number(m.budget).toLocaleString("id-ID")}
                onChange={e => {
                  const raw = e.target.value.replace(/[^\d]/g, "");
                  updateMilestone(m.key, "budget", raw === "" ? "" : Number(raw));
                }}
                placeholder="Rp (opsional)"
                style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }}
              />
              <input
                type="text"
                value={m.pic}
                onChange={e => updateMilestone(m.key, "pic", e.target.value)}
                placeholder="opsional"
                style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }}
              />
              <button
                onClick={() => removeMilestone(m.key)}
                type="button"
                title="Hapus milestone"
                style={{
                  width: 26, height: 26,
                  background: "transparent",
                  border: "none",
                  borderRadius: 6,
                  color: COLORS.danger,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                <Icon name="trash" size={14} color={COLORS.danger} />
              </button>
            </div>
          ))}

          {/* Total allocation indicator */}
          {(() => {
            const totalAlloc = milestones.reduce((sum, m) => sum + (Number(m.budget) || 0), 0);
            const planned = Number(budgetPlanned) || 0;
            const match = planned > 0 && totalAlloc === planned;
            const over = planned > 0 && totalAlloc > planned;
            return (
              <div style={{
                marginTop: 8,
                padding: "8px 10px",
                borderRadius: 8,
                background: planned === 0 ? COLORS.white : match ? COLORS.successBg : over ? COLORS.dangerBg : COLORS.warningBg,
                border: `1px solid ${planned === 0 ? COLORS.border : match ? COLORS.success : over ? COLORS.danger : COLORS.warning}`,
                fontSize: 11,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}>
                <span style={{ fontWeight: 700, color: COLORS.dark }}>
                  Total alokasi milestone: {formatRupiahFull(totalAlloc)}
                </span>
                <span style={{
                  fontWeight: 700,
                  color: planned === 0 ? COLORS.textMuted : match ? COLORS.success : over ? COLORS.danger : COLORS.warning,
                }}>
                  {planned === 0
                    ? "Isi estimasi budget untuk perbandingan"
                    : match
                      ? "Sesuai estimasi budget"
                      : over
                        ? `Melebihi estimasi ${formatRupiahFull(totalAlloc - planned)}`
                        : `Sisa belum dialokasi ${formatRupiahFull(planned - totalAlloc)}`}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Convert to sub unit option */}
        <div
          onClick={() => setConvertToSubUnit(!convertToSubUnit)}
          style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "12px 14px",
            background: convertToSubUnit ? COLORS.successBg : COLORS.bgMuted,
            border: `1px solid ${convertToSubUnit ? COLORS.success : COLORS.border}`,
            borderRadius: 10,
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          <div style={{
            width: 20, height: 20, borderRadius: 5, flexShrink: 0,
            border: `2px solid ${convertToSubUnit ? COLORS.success : COLORS.textLight}`,
            background: convertToSubUnit ? COLORS.success : COLORS.white,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {convertToSubUnit && <Icon name="check" size={13} color={COLORS.white} />}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark }}>
              Jadikan Sub Unit baru saat project selesai
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
              Cocok untuk project seperti pembukaan kolam/cabang baru yang akan jadi unit operasional.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          paddingTop: 16,
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}>
          <Button variant="secondary" onClick={onBack}>Batal</Button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "12px 28px",
              background: COLORS.primary,
              color: COLORS.white,
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="save" size={16} color={COLORS.white} />
            Ajukan Project
          </button>
        </div>
      </Card>
    </FormPageWrapper>
  );
}

const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: COLORS.dark,
  display: "block",
  marginBottom: 5,
};

// ════════════════════════════════════════════════════════════════════════════
// §8.7  DETAIL PAGES (Project, Submission)
// ════════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────
// Project Detail Page (dengan Milestone Checklist + Expense History)
// ──────────────────────────────────────────────────────────────────────────

// Mock milestones — in production, this would come from project.milestones
const MOCK_MILESTONES = {
  "pj-001": [
    { id: "ms-1", name: "Survey & izin lahan",      done: true,  date: "2026-01-31", pic: "Pa Wahyu", budgetAllocated:  6000000 },
    { id: "ms-2", name: "Konstruksi kolam",         done: true,  date: "2026-03-31", pic: "Pa Wahyu", budgetAllocated: 60000000 },
    { id: "ms-3", name: "Instalasi pipa & aerasi",  done: true,  date: "2026-04-30", pic: "Andi",     budgetAllocated: 25000000 },
    { id: "ms-4", name: "Uji coba sistem air",      done: false, date: "2026-05-31", pic: "Rizal",    budgetAllocated:  9000000 },
    { id: "ms-5", name: "Stocking benih perdana",   done: false, date: "2026-06-15", pic: "Rizal",    budgetAllocated: 35000000 },
    { id: "ms-6", name: "Panen perdana & evaluasi", done: false, date: "2026-09-20", pic: "Satya",    budgetAllocated: 20000000 },
    { id: "ms-7", name: "Operasional penuh",        done: false, date: "2026-12-31", pic: "Satya",    budgetAllocated: 25000000 },
  ],
  // pj-002 Biofloc — 45jt, Mar–Sep, 1 done
  "pj-002": [
    { id: "ms-b1", name: "Desain sistem biofloc",     done: true,  date: "2026-03-20", pic: "Satya", budgetAllocated:  5000000 },
    { id: "ms-b2", name: "Pengadaan peralatan aerasi", done: false, date: "2026-05-15", pic: "Satya", budgetAllocated: 18000000 },
    { id: "ms-b3", name: "Instalasi kolam percontohan", done: false, date: "2026-07-10", pic: "Rizal", budgetAllocated: 14000000 },
    { id: "ms-b4", name: "Uji coba & kalibrasi",      done: false, date: "2026-08-20", pic: "Rizal", budgetAllocated:  5000000 },
    { id: "ms-b5", name: "Migrasi penuh semua kolam", done: false, date: "2026-09-30", pic: "Satya", budgetAllocated:  3000000 },
  ],
  // pj-101 Filter Multi-tahap — 43jt, Apr–Jul, 5 done
  "pj-101": [
    { id: "ms-f1", name: "Desain filter zigzag",      done: true,  date: "2026-04-10", pic: "Taufik", budgetAllocated:  4000000 },
    { id: "ms-f2", name: "Pengadaan material filter", done: true,  date: "2026-04-25", pic: "Hendra", budgetAllocated: 12000000 },
    { id: "ms-f3", name: "Konstruksi bak filter",     done: true,  date: "2026-05-15", pic: "Hendra", budgetAllocated: 11000000 },
    { id: "ms-f4", name: "Instalasi UV sterilizer",   done: true,  date: "2026-06-05", pic: "Hendra", budgetAllocated:  9000000 },
    { id: "ms-f5", name: "Pemasangan pompa & pipa",   done: true,  date: "2026-06-25", pic: "Taufik", budgetAllocated:  4000000 },
    { id: "ms-f6", name: "Uji aliran & tekanan",      done: false, date: "2026-07-10", pic: "Taufik", budgetAllocated:  2000000 },
    { id: "ms-f7", name: "Commissioning sistem",      done: false, date: "2026-07-25", pic: "Taufik", budgetAllocated:  1000000 },
  ],
  // pj-201 Cabang Bandung Timur — 45jt, Mar–Sep, 4 done
  "pj-201": [
    { id: "ms-c1", name: "Survey lokasi cabang",      done: true,  date: "2026-03-15", pic: "Rina",  budgetAllocated:  3000000 },
    { id: "ms-c2", name: "Sewa & renovasi tempat",    done: true,  date: "2026-04-20", pic: "Rina",  budgetAllocated: 18000000 },
    { id: "ms-c3", name: "Pengadaan perangkat",       done: true,  date: "2026-05-25", pic: "Sugianto", budgetAllocated: 12000000 },
    { id: "ms-c4", name: "Rekrut & training staff",   done: true,  date: "2026-06-20", pic: "Sugianto", budgetAllocated:  6000000 },
    { id: "ms-c5", name: "Soft opening",              done: false, date: "2026-08-01", pic: "Rina",  budgetAllocated:  4000000 },
    { id: "ms-c6", name: "Grand opening & promo",     done: false, date: "2026-09-15", pic: "Rina",  budgetAllocated:  2000000 },
  ],
  // pj-202 Upgrade POS — 28jt, Feb–Jun, 1 done
  "pj-202": [
    { id: "ms-p1", name: "Analisa kebutuhan sistem",  done: true,  date: "2026-02-20", pic: "Sugianto", budgetAllocated:  4000000 },
    { id: "ms-p2", name: "Pembelian lisensi POS",     done: false, date: "2026-03-25", pic: "Sugianto", budgetAllocated: 12000000 },
    { id: "ms-p3", name: "Setup & konfigurasi",       done: false, date: "2026-04-30", pic: "Andi",  budgetAllocated:  6000000 },
    { id: "ms-p4", name: "Migrasi data lama",         done: false, date: "2026-05-25", pic: "Andi",  budgetAllocated:  4000000 },
    { id: "ms-p5", name: "Training kasir & go-live",  done: false, date: "2026-06-25", pic: "Sugianto", budgetAllocated:  2000000 },
  ],
  // pj-301 Rebranding Gera — 35jt, Jan–Jun, 2 done
  "pj-301": [
    { id: "ms-r1", name: "Riset & moodboard brand",   done: true,  date: "2026-01-31", pic: "Ferry", budgetAllocated:  5000000 },
    { id: "ms-r2", name: "Desain logo & identitas",   done: true,  date: "2026-03-15", pic: "Ferry", budgetAllocated: 12000000 },
    { id: "ms-r3", name: "Pembuatan website baru",    done: false, date: "2026-04-30", pic: "Ferry", budgetAllocated: 13000000 },
    { id: "ms-r4", name: "Produksi materi marketing", done: false, date: "2026-05-31", pic: "Ferry", budgetAllocated:  3000000 },
    { id: "ms-r5", name: "Peluncuran brand baru",     done: false, date: "2026-06-25", pic: "Ferry", budgetAllocated:  2000000 },
  ],
  // pj-302 Renovasi Setiabudi — 52jt, Feb–Jun, 5 done
  "pj-302": [
    { id: "ms-s1", name: "Desain interior outlet",    done: true,  date: "2026-02-15", pic: "Ferry", budgetAllocated:  6000000 },
    { id: "ms-s2", name: "Pembongkaran & persiapan",  done: true,  date: "2026-03-10", pic: "Bayu",  budgetAllocated:  8000000 },
    { id: "ms-s3", name: "Renovasi struktur & cat",   done: true,  date: "2026-04-15", pic: "Bayu",  budgetAllocated: 20000000 },
    { id: "ms-s4", name: "Pemasangan signage",        done: true,  date: "2026-05-10", pic: "Bayu",  budgetAllocated: 10000000 },
    { id: "ms-s5", name: "Furnishing & display",      done: true,  date: "2026-05-30", pic: "Ferry", budgetAllocated:  6000000 },
    { id: "ms-s6", name: "Soft launch outlet",        done: false, date: "2026-06-15", pic: "Ferry", budgetAllocated:  2000000 },
  ],
  // pj-401 Software Distribusi Xpanca — 85jt, Feb–Aug, 2 done
  "pj-401": [
    { id: "ms-x1", name: "Analisa & spesifikasi",     done: true,  date: "2026-02-25", pic: "Fahrizal", budgetAllocated: 10000000 },
    { id: "ms-x2", name: "Desain database & UI",      done: true,  date: "2026-03-31", pic: "Fahrizal", budgetAllocated: 15000000 },
    { id: "ms-x3", name: "Pengembangan modul order",  done: false, date: "2026-05-15", pic: "Fahrizal", budgetAllocated: 20000000 },
    { id: "ms-x4", name: "Modul stok & laporan",      done: false, date: "2026-06-30", pic: "Fahrizal", budgetAllocated: 20000000 },
    { id: "ms-x5", name: "Integrasi & testing",       done: false, date: "2026-07-31", pic: "Fahrizal", budgetAllocated: 12000000 },
    { id: "ms-x6", name: "Deployment & training",     done: false, date: "2026-08-25", pic: "Fahrizal", budgetAllocated:  8000000 },
  ],
};

// Mock expenses
const MOCK_EXPENSES = {
  "pj-001": [
    { id: "ex-1", name: "Survey BPN & dokumen izin",       amount:  4500000, date: "2026-01-25", milestoneId: "ms-1", hasReceipt: true },
    { id: "ex-2", name: "Batu kali 5 truk",                 amount:  8500000, date: "2026-02-15", milestoneId: "ms-2", hasReceipt: true },
    { id: "ex-3", name: "Semen 100 sak",                    amount:  6700000, date: "2026-02-20", milestoneId: "ms-2", hasReceipt: true },
    { id: "ex-4", name: "Bayar tukang konstruksi H1-H30",   amount: 18000000, date: "2026-03-15", milestoneId: "ms-2", hasReceipt: true },
    { id: "ex-5", name: "Bayar tukang H31-H60",             amount: 12000000, date: "2026-03-31", milestoneId: "ms-2", hasReceipt: true },
    { id: "ex-6", name: "Pipa PVC + sambungan",             amount:  9300000, date: "2026-04-10", milestoneId: "ms-3", hasReceipt: true },
    { id: "ex-7", name: "Blower aerasi 2 unit",             amount:  8000000, date: "2026-04-25", milestoneId: "ms-3", hasReceipt: true },
  ],
  // pj-002 — ms-b1 done (5jt, target Mar-20); dibayar sedikit mundur
  "pj-002": [
    { id: "ex-b1", name: "Jasa desain sistem biofloc",      amount:  5000000, date: "2026-03-24", milestoneId: "ms-b1", hasReceipt: true },
  ],
  // pj-101 — ms-f1..f5 done
  "pj-101": [
    { id: "ex-f1", name: "Jasa desain filter zigzag",       amount:  4000000, date: "2026-04-12", milestoneId: "ms-f1", hasReceipt: true },
    { id: "ex-f2", name: "Material filter (gravel, zeolit)", amount:  7000000, date: "2026-04-22", milestoneId: "ms-f2", hasReceipt: true },
    { id: "ex-f3", name: "Pasir silika + tandon",           amount:  5000000, date: "2026-05-02", milestoneId: "ms-f2", hasReceipt: true },
    { id: "ex-f4", name: "Upah konstruksi bak filter",      amount: 11000000, date: "2026-05-18", milestoneId: "ms-f3", hasReceipt: true },
    { id: "ex-f5", name: "Unit UV sterilizer",              amount:  9000000, date: "2026-06-08", milestoneId: "ms-f4", hasReceipt: true },
    { id: "ex-f6", name: "Pompa + instalasi pipa",          amount:  4000000, date: "2026-06-27", milestoneId: "ms-f5", hasReceipt: true },
  ],
  // pj-201 — ms-c1..c4 done
  "pj-201": [
    { id: "ex-c1", name: "Biaya survey & administrasi",     amount:  3000000, date: "2026-03-18", milestoneId: "ms-c1", hasReceipt: true },
    { id: "ex-c2", name: "Sewa tempat 1 tahun",             amount: 12000000, date: "2026-04-15", milestoneId: "ms-c2", hasReceipt: true },
    { id: "ex-c3", name: "Renovasi & cat cabang",           amount:  6000000, date: "2026-04-28", milestoneId: "ms-c2", hasReceipt: true },
    { id: "ex-c4", name: "Komputer + perangkat server",     amount: 12000000, date: "2026-05-28", milestoneId: "ms-c3", hasReceipt: true },
    { id: "ex-c5", name: "Honor training staff",            amount:  6000000, date: "2026-06-22", milestoneId: "ms-c4", hasReceipt: true },
  ],
  // pj-202 — ms-p1 done (4jt, Feb-20)
  "pj-202": [
    { id: "ex-p1", name: "Jasa analisa kebutuhan sistem",   amount:  4000000, date: "2026-02-22", milestoneId: "ms-p1", hasReceipt: true },
  ],
  // pj-301 — ms-r1, ms-r2 done
  "pj-301": [
    { id: "ex-r1", name: "Riset brand & moodboard",         amount:  5000000, date: "2026-02-03", milestoneId: "ms-r1", hasReceipt: true },
    { id: "ex-r2", name: "Jasa desain logo & identitas",    amount: 12000000, date: "2026-03-20", milestoneId: "ms-r2", hasReceipt: true },
  ],
  // pj-302 — ms-s1..s5 done
  "pj-302": [
    { id: "ex-s1", name: "Jasa desain interior",            amount:  6000000, date: "2026-02-18", milestoneId: "ms-s1", hasReceipt: true },
    { id: "ex-s2", name: "Upah bongkar & persiapan",        amount:  8000000, date: "2026-03-12", milestoneId: "ms-s2", hasReceipt: true },
    { id: "ex-s3", name: "Material renovasi & cat",         amount: 14000000, date: "2026-04-10", milestoneId: "ms-s3", hasReceipt: true },
    { id: "ex-s4", name: "Upah tukang renovasi",            amount:  6000000, date: "2026-04-20", milestoneId: "ms-s3", hasReceipt: true },
    { id: "ex-s5", name: "Signage & neon box",              amount: 10000000, date: "2026-05-12", milestoneId: "ms-s4", hasReceipt: true },
    { id: "ex-s6", name: "Furnitur & display produk",       amount:  6000000, date: "2026-06-02", milestoneId: "ms-s5", hasReceipt: true },
  ],
  // pj-401 — ms-x1, ms-x2 done
  "pj-401": [
    { id: "ex-x1", name: "Honor analisa & spesifikasi",     amount: 10000000, date: "2026-02-28", milestoneId: "ms-x1", hasReceipt: true },
    { id: "ex-x2", name: "Honor desain DB & UI",            amount: 15000000, date: "2026-04-05", milestoneId: "ms-x2", hasReceipt: true },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// LIVE — in-session live data binding (Tahap 2)
// ────────────────────────────────────────────────────────────────────────────
// Helper functions (getSubUnitSnapshotForPeriod, deriveScoreFromSubmission, …)
// run OUTSIDE React, so they cannot read Context. They read from this LIVE
// object instead. The DataStoreProvider keeps LIVE in sync with its state via
// syncLive() on every change, so helpers always see the latest in-session data.
//
// Initialized from the module constants (the seed/mock data). After the user
// edits anything, LIVE reflects those edits for the rest of the session.
// ════════════════════════════════════════════════════════════════════════════
const LIVE = {
  submissions: KPI_SUBMISSIONS,
  subUnits: SUB_UNITS,
  milestones: MOCK_MILESTONES,
  expenses: MOCK_EXPENSES,
  projects: PROJECTS,
  templates: FORM_TEMPLATES,
  subUnitWeights: {},
};

/** Sync the LIVE binding from store state. Called by the provider on changes. */
function syncLive(next) {
  if (next.submissions) LIVE.submissions = next.submissions;
  if (next.subUnits) LIVE.subUnits = next.subUnits;
  if (next.milestones) LIVE.milestones = next.milestones;
  if (next.expenses) LIVE.expenses = next.expenses;
  if (next.projects) LIVE.projects = next.projects;
  if (next.templates) LIVE.templates = next.templates;
  if (next.subUnitWeights) LIVE.subUnitWeights = next.subUnitWeights;
}

/**
 * Ganti binding modul UNITS & USERS dengan data dari API (objek ter-index id).
 * Dipakai bootstrap loader setelah login. Pembacaan UNITS[id]/USERS[id] di mana
 * pun akan otomatis melihat data terbaru karena ini binding modul.
 */
function setUnitsData(map) { UNITS = map; }
function setUsersData(map) { USERS = map; }

function ProjectDetailPage({ user, projectId, onBack, onAddExpense }) {
  const store = useDataStore();
  const project = LIVE.projects.find(p => p.id === projectId);
  const [milestones, setMilestones] = useState(LIVE.milestones[projectId] || []);
  const [expenses, setExpenses] = useState(LIVE.expenses[projectId] || []);
  const [tab, setTab] = useState("overview");

  // Mirror local milestone/expense edits back to the global store so the
  // dashboard budget summary and project progress reflect them across menus.
  useEffect(() => {
    if (!store) return;
    store.setMilestones(prev => ({ ...prev, [projectId]: milestones }));
    // keep project.milestonesDone in sync
    const done = milestones.filter(m => m.done).length;
    store.setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, milestonesDone: done, milestonesTotal: milestones.length } : p
    ));
  }, [milestones]);
  useEffect(() => {
    if (!store) return;
    store.setExpenses(prev => ({ ...prev, [projectId]: expenses }));
    // keep project.budgetSpent in sync
    const spent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    store.setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, budgetSpent: spent } : p
    ));
  }, [expenses]);

  if (!project) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 14px" }}>
        <button onClick={onBack} style={backButtonStyle}>← Kembali</button>
        <Card style={{ padding: 30, textAlign: "center", color: COLORS.textMuted }}>
          Project tidak ditemukan
        </Card>
      </div>
    );
  }

  const unit = UNITS[project.unitId];
  const subUnit = project.subUnitId ? LIVE.subUnits.find(s => s.id === project.subUnitId) : null;
  const status = getProjectStatusInfo(project.status);

  // Serapan per milestone = total expense yang terkait milestone tersebut
  const getSpentForMilestone = (msId) =>
    expenses
      .filter(ex => ex.milestoneId === msId)
      .reduce((sum, ex) => sum + ex.amount, 0);

  // Calculate milestone progress from current state
  const milestonesDone = milestones.filter(m => m.done).length;
  const workProgress = milestones.length > 0
    ? Math.round((milestonesDone / milestones.length) * 100)
    : 0;
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetProgress = project.budgetPlanned > 0
    ? Math.round((totalSpent / project.budgetPlanned) * 100)
    : 0;

  // Check permission to edit (Leader & PIC of this unit/sub-unit)
  const canEdit = user.role === ROLES.OWNER ||
    (user.role === ROLES.LEADER && user.unitId === project.unitId) ||
    (user.role === ROLES.PIC && (user.subUnitId === project.subUnitId || project.subUnitId === null));

  const toggleMilestone = (msId) => {
    if (!canEdit) {
      alert("Anda tidak punya akses untuk update milestone ini");
      return;
    }
    setMilestones(prev => prev.map(m =>
      m.id === msId ? { ...m, done: !m.done } : m
    ));
  };

  // ─── Milestone CRUD (Level A: local state only) ───
  const [showMsForm, setShowMsForm] = useState(false);
  const [editingMsId, setEditingMsId] = useState(null);  // null = add mode
  const [msFormName, setMsFormName] = useState("");
  const [msFormDate, setMsFormDate] = useState("");
  const [msFormPic, setMsFormPic] = useState("");
  const [msFormBudget, setMsFormBudget] = useState("");

  const openAddMilestone = () => {
    if (!canEdit) { alert("Anda tidak punya akses untuk tambah milestone"); return; }
    setEditingMsId(null);
    setMsFormName(""); setMsFormDate(""); setMsFormPic(""); setMsFormBudget("");
    setShowMsForm(true);
  };

  const openEditMilestone = (ms) => {
    if (!canEdit) { alert("Anda tidak punya akses untuk edit milestone"); return; }
    setEditingMsId(ms.id);
    setMsFormName(ms.name);
    setMsFormDate(ms.date);
    setMsFormPic(ms.pic || "");
    setMsFormBudget(ms.budgetAllocated || "");
    setShowMsForm(true);
  };

  const saveMilestone = () => {
    if (!msFormName.trim()) { alert("Isi nama milestone"); return; }
    if (!msFormDate)        { alert("Isi tanggal target"); return; }

    if (editingMsId === null) {
      // Add new
      const newMs = {
        id: `ms-new-${Date.now()}`,
        name: msFormName.trim(),
        date: msFormDate,
        pic: msFormPic.trim(),
        budgetAllocated: Number(msFormBudget) || 0,
        done: false,
      };
      setMilestones(prev => [...prev, newMs]);
      alert(`Milestone "${newMs.name}" ditambahkan.`);
    } else {
      // Edit existing
      setMilestones(prev => prev.map(m =>
        m.id === editingMsId
          ? { ...m, name: msFormName.trim(), date: msFormDate, pic: msFormPic.trim(), budgetAllocated: Number(msFormBudget) || 0 }
          : m
      ));
      alert(`Milestone "${msFormName}" diperbarui.`);
    }
    setShowMsForm(false);
  };

  const deleteMilestone = (ms) => {
    if (!canEdit) { alert("Anda tidak punya akses untuk hapus milestone"); return; }
    if (!confirm(`Hapus milestone "${ms.name}"?\n\nExpense yang terkait milestone ini akan kehilangan referensinya.`)) return;
    setMilestones(prev => prev.filter(m => m.id !== ms.id));
  };

  // ─── Expense / Realisasi rinci (inline, Level A in-session) ───
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [exName, setExName] = useState("");
  const [exAmount, setExAmount] = useState("");
  const [exDate, setExDate] = useState("");
  const [exMilestoneId, setExMilestoneId] = useState("");
  const [exHasReceipt, setExHasReceipt] = useState(false);

  const openExpenseForm = (presetMsId = "") => {
    if (!canEdit) { alert("Anda tidak punya akses untuk input realisasi"); return; }
    setExName(""); setExAmount(""); setExDate(""); setExMilestoneId(presetMsId); setExHasReceipt(false);
    setShowExpenseForm(true);
  };

  const saveExpense = () => {
    if (!exName.trim())  { alert("Isi keterangan realisasi"); return; }
    if (!exAmount)       { alert("Isi jumlah realisasi"); return; }
    if (!exDate)         { alert("Isi tanggal"); return; }
    if (!exHasReceipt)   { alert("Bukti/nota wajib dikonfirmasi (centang 'Bukti terlampir')"); return; }
    const newEx = {
      id: `ex-new-${Date.now()}`,
      name: exName.trim(),
      amount: Number(exAmount),
      date: exDate,
      milestoneId: exMilestoneId || null,
      hasReceipt: true,
    };
    setExpenses(prev => [...prev, newEx]);
    alert(`Realisasi "${newEx.name}" sebesar ${formatRupiahFull(newEx.amount)} dicatat.`);
    setShowExpenseForm(false);
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 14px" }}>
      <button onClick={onBack} style={backButtonStyle}>← Kembali ke Project</button>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${unit.color}, ${unit.colorDark})`,
        padding: "20px 22px",
        borderRadius: 14,
        color: COLORS.white,
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.12)" }}><Icon name={unit.icon} size={26} color={COLORS.white} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>
              Project
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{project.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 5 }}>
              {unit.name}{subUnit && <> · {subUnit.name}</>} • {formatDate(project.startDate)} → {formatDate(project.endDate)}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", marginTop: 6 }}>
              {project.desc}
            </div>
          </div>
        </div>

        {/* Dual progress */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginBottom: 4, fontWeight: 600 }}>Pekerjaan: {milestonesDone}/{milestones.length} milestone
            </div>
            <ProgressBar value={workProgress} color={COLORS.white} height={8} />
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>{workProgress}%</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginBottom: 4, fontWeight: 600 }}>Budget: {formatRupiah(totalSpent)} / {formatRupiah(project.budgetPlanned)}
            </div>
            <ProgressBar
              value={budgetProgress}
              color={budgetProgress > 100 ? "#FCA5A5" : budgetProgress > 85 ? "#FCD34D" : COLORS.white}
              height={8}
            />
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>{budgetProgress}%</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 5, marginBottom: 16, borderBottom: `1px solid ${COLORS.bgMuted}` }}>
        {[
          ["overview", "Overview"],
          ["milestones", `Milestone (${milestonesDone}/${milestones.length})`],
          ["expenses", `Expense (${expenses.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "10px 14px",
              border: "none",
              borderBottom: `2px solid ${tab === key ? COLORS.primary : "transparent"}`,
              background: "transparent",
              color: tab === key ? COLORS.primary : COLORS.textMuted,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <Card style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 14 }}>
            Ringkasan Project
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <StatBox label="Status" value={status.label} color={status.color} />
            <StatBox label="Pekerjaan" value={`${workProgress}%`} color={COLORS.primary} />
            <StatBox label="Budget Terpakai" value={`${budgetProgress}%`} color={budgetProgress > 100 ? COLORS.danger : COLORS.warning} />
            <StatBox label="Sisa Budget" value={formatRupiah(Math.max(0, project.budgetPlanned - totalSpent))} color={COLORS.success} />
          </div>

          {/* Budget per bulan: rencana (tgl target milestone) vs realisasi (tgl bayar) */}
          {(() => {
            // Build month buckets from both milestone target dates and expense dates
            const buckets = {}; // "YYYY-MM" -> { rencana, realisasi }
            const monthKey = (iso) => (iso || "").slice(0, 7);
            milestones.forEach(m => {
              const k = monthKey(m.date);
              if (!k) return;
              if (!buckets[k]) buckets[k] = { rencana: 0, realisasi: 0 };
              buckets[k].rencana += Number(m.budgetAllocated) || 0;
            });
            expenses.forEach(ex => {
              const k = monthKey(ex.date);
              if (!k) return;
              if (!buckets[k]) buckets[k] = { rencana: 0, realisasi: 0 };
              buckets[k].realisasi += Number(ex.amount) || 0;
            });
            const months = Object.keys(buckets).sort();
            if (months.length === 0) return null;

            const monthLabel = (k) => {
              const [y, m] = k.split("-").map(n => parseInt(n, 10));
              return `${MONTH_NAMES_ID[m - 1].slice(0, 3)} ${y}`;
            };
            const totalRencana = months.reduce((s, k) => s + buckets[k].rencana, 0);
            const totalRealisasi = months.reduce((s, k) => s + buckets[k].realisasi, 0);

            return (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark, marginBottom: 4 }}>
                  Budget per Bulan — Rencana vs Realisasi
                </div>
                <div style={{ fontSize: 10.5, color: COLORS.textMuted, marginBottom: 10 }}>
                  Rencana berdasarkan tanggal target milestone • Realisasi berdasarkan tanggal pembayaran. Selisih = pergeseran cashflow.
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                    <thead>
                      <tr style={{ background: COLORS.bgMuted }}>
                        <th style={{ ...tableHeaderStyle, textAlign: "left" }}>Bulan</th>
                        <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Rencana</th>
                        <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Realisasi</th>
                        <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Selisih</th>
                        <th style={{ ...tableHeaderStyle, textAlign: "left" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {months.map(k => {
                        const b = buckets[k];
                        const selisih = b.rencana - b.realisasi;
                        let statusLabel, statusColor;
                        if (b.rencana === 0 && b.realisasi > 0) {
                          statusLabel = "Bayar (tanpa target bln ini)"; statusColor = COLORS.info;
                        } else if (selisih > 0) {
                          statusLabel = "Belum terbayar penuh"; statusColor = COLORS.warning;
                        } else if (selisih < 0) {
                          statusLabel = "Lebih bayar / dari rencana lain"; statusColor = COLORS.primary;
                        } else {
                          statusLabel = "Sesuai jadwal"; statusColor = COLORS.success;
                        }
                        return (
                          <tr key={k} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                            <td style={{ padding: "8px 10px", fontWeight: 700, color: COLORS.dark }}>{monthLabel(k)}</td>
                            <td style={{ padding: "8px 10px", textAlign: "right", color: COLORS.text }}>{b.rencana > 0 ? formatRupiah(b.rencana) : "—"}</td>
                            <td style={{ padding: "8px 10px", textAlign: "right", color: COLORS.text }}>{b.realisasi > 0 ? formatRupiah(b.realisasi) : "—"}</td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: selisih > 0 ? COLORS.warning : selisih < 0 ? COLORS.primary : COLORS.success }}>
                              {selisih === 0 ? "0" : formatRupiah(Math.abs(selisih))}
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              <span style={{ fontSize: 10, color: statusColor, fontWeight: 700 }}>{statusLabel}</span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ background: COLORS.bg, borderTop: `2px solid ${COLORS.border}` }}>
                        <td style={{ padding: "9px 10px", fontWeight: 800, color: COLORS.dark }}>Total</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 800, color: COLORS.secondary }}>{formatRupiah(totalRencana)}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 800, color: COLORS.warning }}>{formatRupiah(totalRealisasi)}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 800, color: (totalRencana - totalRealisasi) >= 0 ? COLORS.success : COLORS.danger }}>{formatRupiah(Math.abs(totalRencana - totalRealisasi))}</td>
                        <td style={{ padding: "9px 10px" }}>
                          <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700 }}>
                            {totalRealisasi < totalRencana ? `${formatRupiah(totalRencana - totalRealisasi)} belum cair` : "Sesuai/terlampaui"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          <div style={{ marginTop: 16 }}>
            <InfoBanner icon="info" variant="info">
              Klik tab <strong>Milestone</strong> untuk centang pekerjaan yang sudah selesai.
              Klik tab <strong>Expense</strong> untuk catat pengeluaran (wajib upload bukti).
            </InfoBanner>
          </div>
        </Card>
      )}

      {tab === "milestones" && (
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark }}>
                Milestone Project
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                {canEdit ? "Centang milestone yang sudah selesai. Progress otomatis update." : "View only — Anda tidak punya akses edit"}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Pill color={COLORS.primary} bg={COLORS.infoBg}>
                {milestonesDone}/{milestones.length} • {workProgress}%
              </Pill>
              {canEdit && (
                <button
                  onClick={openAddMilestone}
                  type="button"
                  style={{
                    padding: "7px 12px",
                    background: COLORS.primary,
                    color: COLORS.white,
                    border: "none",
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Icon name="plus" size={13} color={COLORS.white} />
                  Tambah
                </button>
              )}
            </div>
          </div>

          {/* Inline add/edit milestone form */}
          {showMsForm && (
            <div style={{
              padding: "14px 16px",
              background: COLORS.infoBg,
              border: `1px solid #C5DBF0`,
              borderRadius: 10,
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.primaryDark, marginBottom: 10 }}>
                {editingMsId === null ? "Milestone Baru" : "Edit Milestone"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 120px 120px", gap: 8, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Nama <span style={{ color: COLORS.danger }}>*</span></label>
                  <input
                    type="text"
                    value={msFormName}
                    onChange={e => setMsFormName(e.target.value)}
                    placeholder="cth: Survey & izin lahan"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Target Tgl <span style={{ color: COLORS.danger }}>*</span></label>
                  <input type="date" value={msFormDate} onChange={e => setMsFormDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Alokasi Budget</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={msFormBudget === "" ? "" : Number(msFormBudget).toLocaleString("id-ID")}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, "");
                      setMsFormBudget(raw === "" ? "" : Number(raw));
                    }}
                    placeholder="Rp"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>PIC</label>
                  <input
                    type="text"
                    value={msFormPic}
                    onChange={e => setMsFormPic(e.target.value)}
                    placeholder="opsional"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowMsForm(false)} type="button" style={adminBtnStyle}>Batal</button>
                <button
                  onClick={saveMilestone}
                  type="button"
                  style={{
                    padding: "7px 16px",
                    background: COLORS.primary,
                    color: COLORS.white,
                    border: "none",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {editingMsId === null ? "Tambah" : "Simpan"}
                </button>
              </div>
            </div>
          )}

          {milestones.map((ms, i) => (
            <MilestoneRow
              key={ms.id}
              milestone={ms}
              spent={getSpentForMilestone(ms.id)}
              isLast={i === milestones.length - 1}
              canEdit={canEdit}
              onToggle={() => toggleMilestone(ms.id)}
              onEdit={() => openEditMilestone(ms)}
              onDelete={() => deleteMilestone(ms)}
            />
          ))}
        </Card>
      )}

      {tab === "expenses" && (
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark }}>
                Realisasi Budget (Pengeluaran)
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                Total {expenses.length} entry • {formatRupiah(totalSpent)} terpakai
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => openExpenseForm("")}
                type="button"
                style={{
                  padding: "9px 15px",
                  background: COLORS.primary,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="plus" size={14} color={COLORS.white} />
                Input Realisasi
              </button>
            )}
          </div>

          {/* Inline expense / realisasi form */}
          {showExpenseForm && (
            <div style={{
              padding: "14px 16px",
              background: COLORS.infoBg,
              border: `1px solid #C5DBF0`,
              borderRadius: 10,
              marginBottom: 14,
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.primaryDark, marginBottom: 10 }}>
                Input Realisasi Budget
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Keterangan <span style={{ color: COLORS.danger }}>*</span></label>
                <input
                  type="text"
                  value={exName}
                  onChange={e => setExName(e.target.value)}
                  placeholder="cth: Beli pipa PVC + sambungan"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Jumlah (Rp) <span style={{ color: COLORS.danger }}>*</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={exAmount === "" ? "" : Number(exAmount).toLocaleString("id-ID")}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, "");
                      setExAmount(raw === "" ? "" : Number(raw));
                    }}
                    placeholder="cth: 9.300.000"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tanggal <span style={{ color: COLORS.danger }}>*</span></label>
                  <input type="date" value={exDate} onChange={e => setExDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Kaitkan ke Milestone</label>
                <select value={exMilestoneId} onChange={e => setExMilestoneId(e.target.value)} style={inputStyle}>
                  <option value="">— Tidak terkait milestone tertentu —</option>
                  {milestones.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div
                onClick={() => setExHasReceipt(!exHasReceipt)}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "9px 12px",
                  background: exHasReceipt ? COLORS.successBg : COLORS.white,
                  border: `1px solid ${exHasReceipt ? COLORS.success : COLORS.border}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  marginBottom: 12,
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${exHasReceipt ? COLORS.success : COLORS.textLight}`,
                  background: exHasReceipt ? COLORS.success : COLORS.white,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {exHasReceipt && <Icon name="check" size={11} color={COLORS.white} strokeWidth={3} />}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.dark }}>
                  Bukti/nota terlampir <span style={{ color: COLORS.danger }}>*</span> (wajib untuk realisasi)
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowExpenseForm(false)} type="button" style={adminBtnStyle}>Batal</button>
                <button
                  onClick={saveExpense}
                  type="button"
                  style={{
                    padding: "8px 18px",
                    background: COLORS.primary,
                    color: COLORS.white,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Simpan Realisasi
                </button>
              </div>
            </div>
          )}

          {expenses.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: COLORS.textLight, fontSize: 12 }}>
              Belum ada realisasi tercatat
            </div>
          ) : (
            expenses.map((ex, i) => (
              <ExpenseRow key={ex.id} expense={ex} milestones={milestones} isLast={i === expenses.length - 1} />
            ))
          )}
        </Card>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      padding: "12px 14px",
      background: "#FAFBFC",
      border: `1px solid ${COLORS.bgMuted}`,
      borderRadius: 10,
    }}>
      <div style={{ fontSize: 10, color: COLORS.textLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function MilestoneRow({ milestone, spent = 0, isLast, canEdit, onToggle, onEdit, onDelete }) {
  const allocated = milestone.budgetAllocated || 0;
  const hasBudget = allocated > 0;
  const pct = hasBudget ? Math.round((spent / allocated) * 100) : 0;
  const over = hasBudget && spent > allocated;
  const barColor = over ? COLORS.danger : pct >= 90 ? COLORS.warning : COLORS.success;

  return (
    <div style={{
      padding: "12px 14px",
      background: milestone.done ? COLORS.successBg : "#FAFBFC",
      border: `1px solid ${milestone.done ? "#CDE3C2" : COLORS.bgMuted}`,
      borderRadius: 10,
      marginBottom: isLast ? 0 : 8,
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
    }}>
      <button
        onClick={canEdit ? onToggle : undefined}
        disabled={!canEdit}
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          border: `2px solid ${milestone.done ? COLORS.success : COLORS.border}`,
          background: milestone.done ? COLORS.success : COLORS.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: canEdit ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          flexShrink: 0,
          padding: 0,
          marginTop: 1,
        }}
      >
        {milestone.done && <Icon name="check" size={15} color={COLORS.white} strokeWidth={2.5} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: milestone.done ? "#3F6E31" : COLORS.dark,
          textDecoration: milestone.done ? "line-through" : "none",
        }}>
          {milestone.name}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
          Target: {formatDate(milestone.date)}{milestone.pic && ` • PIC: ${milestone.pic}`}
        </div>

        {/* Budget per milestone: serapan vs alokasi */}
        {hasBudget ? (
          <div style={{ marginTop: 7 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 11,
              marginBottom: 3,
            }}>
              <span style={{ color: COLORS.textMuted }}>
                Budget: <strong style={{ color: over ? COLORS.danger : COLORS.text }}>{formatRupiahFull(spent)}</strong> / {formatRupiahFull(allocated)}
              </span>
              <span style={{ fontWeight: 800, color: barColor }}>
                {pct}%{over ? " • Over!" : ""}
              </span>
            </div>
            <div style={{
              height: 6,
              background: COLORS.border,
              borderRadius: 99,
              overflow: "hidden",
            }}>
              <div style={{
                width: `${Math.min(pct, 100)}%`,
                height: "100%",
                background: barColor,
                borderRadius: 99,
                transition: "width 0.3s",
              }} />
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 5, fontSize: 10, color: COLORS.textLight, fontStyle: "italic" }}>
            Budget belum dialokasi
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
        {milestone.done && (
          <Pill color={COLORS.success} bg={COLORS.successBg}>Done</Pill>
        )}

        {canEdit && onEdit && onDelete && (
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={onEdit}
              type="button"
            title="Edit milestone"
            style={{
              width: 28, height: 28,
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <Icon name="edit" size={13} color={COLORS.textMuted} />
          </button>
          <button
            onClick={onDelete}
            type="button"
            title="Hapus milestone"
            style={{
              width: 28, height: 28,
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <Icon name="trash" size={13} color={COLORS.danger} />
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

function ExpenseRow({ expense, milestones, isLast }) {
  const ms = milestones.find(m => m.id === expense.milestoneId);

  return (
    <div style={{
      padding: "12px 14px",
      borderBottom: isLast ? "none" : `1px solid ${COLORS.bgMuted}`,
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: COLORS.warningBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}><Icon name="money" size={18} color={COLORS.warning} /></div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark }}>{expense.name}</div>
        <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>
          {formatDate(expense.date)}
          {ms && <> • Milestone: {ms.name}</>}
          {expense.hasReceipt && <> • Bukti terlampir</>}
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.dark }}>
        {formatRupiah(expense.amount)}
      </div>
    </div>
  );
}

const backButtonStyle = {
  background: "transparent",
  border: "none",
  color: COLORS.textMuted,
  cursor: "pointer",
  fontSize: 12,
  padding: "4px 0 12px",
  fontFamily: "inherit",
};

// Small secondary button used in admin tables/headers
const adminBtnStyle = {
  padding: "6px 12px",
  background: COLORS.white,
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 7,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const adminBtnDanger = {
  padding: "6px 12px",
  background: COLORS.white,
  color: COLORS.danger,
  border: `1px solid ${COLORS.danger}`,
  borderRadius: 7,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

// ──────────────────────────────────────────────────────────────────────────
// Submission Detail Page (lihat detail KPI submission)
// ──────────────────────────────────────────────────────────────────────────

function SubmissionDetailPage({ user, submissionId, onBack, onClose, onUpdate }) {
  const submission = LIVE.submissions.find(s => s.id === submissionId);
  const template = submission ? getFormTemplate(submission.templateId) : null;
  const subUnit = submission ? LIVE.subUnits.find(s => s.id === submission.subUnitId) : null;
  const unit = subUnit ? UNITS[subUnit.unitId] : null;
  const submitter = submission ? getUser(submission.createdBy) : null;
  const [showDailyMargin, setShowDailyMargin] = useState(false);

  if (!submission || !template || !subUnit) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 14px" }}>
        <button onClick={onBack} style={backButtonStyle}>← Kembali</button>
        <Card style={{ padding: 30, textAlign: "center", color: COLORS.textMuted }}>
          Submission tidak ditemukan
        </Card>
      </div>
    );
  }

  const estimatedComputed = useMemo(
    () => computeFieldValues(template, submission.estimatedValues),
    [submission.id]
  );

  const actualComputed = useMemo(
    () => submission.actualValues ? computeFieldValues(template, submission.actualValues) : {},
    [submission.id]
  );

  const STATUS_INFO = {
    estimated: { label: "Menunggu Approval", color: COLORS.warning, bg: COLORS.warningBg, icon: "" },
    approved:  { label: "Aktif (sedang berjalan)", color: COLORS.success, bg: COLORS.successBg, icon: "" },
    closed:    { label: "Closed", color: COLORS.primary, bg: COLORS.infoBg, icon: "" },
  };
  const statusInfo = STATUS_INFO[submission.status];

  // Permission for actions
  const isMine = submission.createdBy === user.id ||
    (user.role === ROLES.LEADER && submission.unitId === user.unitId) ||
    (user.role === ROLES.PIC && submission.subUnitId === user.subUnitId);

  const canClose = isMine && submission.status === "approved" && template.frequency !== "monthly";
  const canUpdate = isMine && submission.status === "approved" && template.frequency === "monthly";

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 14px" }}>
      <button onClick={onBack} style={backButtonStyle}>← Kembali</button>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${unit.color}, ${unit.colorDark})`,
        padding: "20px 22px",
        borderRadius: 14,
        color: COLORS.white,
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.12)" }}><Icon name={unit.icon} size={26} color={COLORS.white} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>
              KPI Submission
            </div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{subUnit.name} — {template.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="calendar" size={13} color="rgba(255,255,255,0.85)" /> {submission.period}
              {" • "}
              Diajukan oleh {submitter?.name} pada {formatDate(submission.createdAt)}
            </div>
          </div>
          <Pill color={COLORS.white} bg="rgba(255,255,255,0.25)">
            {statusInfo.label}
          </Pill>
        </div>
      </div>

      {/* Action buttons */}
      {(canClose || canUpdate) && (
        <Card style={{ padding: "14px 16px", marginBottom: 14, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 12, color: "#92400E" }}>
              {canClose
                ? "Siklus/event sudah berakhir? Klik tombol untuk closing KPI."
                : "Update nilai realisasi sepanjang bulan kapan saja."}
            </div>
            {canClose && (
              <button
                onClick={() => onClose(submission.id)}
                type="button"
                style={{ padding: "8px 16px", background: COLORS.primary, color: COLORS.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >Tutup KPI Sekarang</button>
            )}
            {canUpdate && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowDailyMargin(true)}
                  type="button"
                  style={{ padding: "8px 16px", background: COLORS.secondary, color: COLORS.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Icon name="calendar" size={13} color={COLORS.white} style={{ pointerEvents: "none" }} /> Margin Harian
                </button>
                <button
                  onClick={() => onUpdate(submission.id)}
                  type="button"
                  style={{ padding: "8px 16px", background: COLORS.primary, color: COLORS.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >Update Realisasi</button>
              </div>
            )}
          </div>
        </Card>
      )}

      {showDailyMargin && (
        <DailyMarginPanel
          submission={submission}
          subUnitName={subUnit.name}
          periodLabel={submission.period}
          onClose={() => setShowDailyMargin(false)}
        />
      )}

      {/* Values comparison */}
      <Card style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark, marginBottom: 12 }}>Detail Nilai KPI
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: COLORS.bgMuted }}>
                <th style={tableHeaderStyle}>Variabel</th>
                <th style={tableHeaderStyle}>Estimasi</th>
                <th style={tableHeaderStyle}>Realisasi</th>
                {submission.actualValues && <th style={tableHeaderStyle}>Pencapaian</th>}
                <th style={tableHeaderStyle}>Bobot</th>
              </tr>
            </thead>
            <tbody>
              {template.fields.map(field => {
                const estVal = field.type === "auto"
                  ? estimatedComputed[field.name]
                  : submission.estimatedValues[field.id];
                const actVal = submission.actualValues
                  ? (field.type === "auto"
                    ? actualComputed[field.name]
                    : submission.actualValues[field.id])
                  : null;

                const weight = submission.fieldWeights[field.id] || field.defaultWeight || 0;

                let achievement = null;
                if (actVal !== null && estVal && estVal !== 0) {
                  achievement = Math.round((actVal / estVal) * 100);
                }

                return (
                  <tr key={field.id} style={{ borderTop: `1px solid ${COLORS.bgMuted}` }}>
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 700, color: COLORS.dark }}>
                        {field.type === "auto" && ""}{field.name}
                        {field.isMargin && <span style={{ marginLeft: 6 }}><Pill color={COLORS.success} bg={COLORS.successBg}></Pill></span>}
                      </div>
                      <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 2 }}>
                        {field.satuan && `${field.satuan} • `}{field.source}
                      </div>
                    </td>
                    <td style={{ ...tableCellStyle, color: COLORS.textMuted }}>
                      {formatFieldValue(estVal, field.satuan, field.type)}
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: 700, color: actVal !== null ? COLORS.dark : COLORS.textLight }}>
                      {actVal !== null ? formatFieldValue(actVal, field.satuan, field.type) : "— belum closing"}
                    </td>
                    {submission.actualValues && (
                      <td style={tableCellStyle}>
                        {achievement !== null && (
                          <Pill
                            color={achievement >= 100 ? COLORS.success : achievement >= 80 ? COLORS.warning : COLORS.danger}
                            bg={achievement >= 100 ? COLORS.successBg : achievement >= 80 ? COLORS.warningBg : COLORS.dangerBg}
                          >
                            {achievement}%
                          </Pill>
                        )}
                      </td>
                    )}
                    <td style={{ ...tableCellStyle, color: COLORS.textMuted }}>
                      {weight > 0 ? `${weight}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Closing note */}
      {submission.closingNote && (
        <Card style={{
          marginTop: 14,
          padding: "14px 16px",
          background: "#F0FDF4",
          border: "1px solid #BBF7D0",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", marginBottom: 6 }}>Catatan Closing
          </div>
          <div style={{ fontSize: 12, color: "#065F46", lineHeight: 1.5, fontStyle: "italic" }}>
            "{submission.closingNote}"
          </div>
          <div style={{ fontSize: 10, color: "#065F46", marginTop: 6 }}>
            — Closed pada {formatDate(submission.closedAt)}
          </div>
        </Card>
      )}

      {/* Approval info */}
      {submission.approvedAt && (
        <Card style={{ marginTop: 10, padding: "10px 14px", background: "#FAFBFC", fontSize: 11, color: COLORS.textMuted }}>Approved by <strong>{getUser(submission.approvedBy)?.name}</strong> pada {formatDate(submission.approvedAt)}
        </Card>
      )}
    </div>
  );
}

const tableHeaderStyle = {
  padding: "10px 12px",
  fontSize: 10,
  fontWeight: 700,
  color: COLORS.textMuted,
  textAlign: "left",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const tableCellStyle = {
  padding: "10px 12px",
};


// ════════════════════════════════════════════════════════════════════════════
// §9  ADMIN PAGES (Owner only)
// ════════════════════════════════════════════════════════════════════════════

function AdminPanel() {
  const [section, setSection] = useState("forms");

  const sections = [
    ["forms",       "Form Library"],
    ["units",       "Unit Manager"],
    ["subunits",    "Sub Unit Manager"],
    ["users",       "User Manager"],
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 14px" }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: COLORS.dark, margin: 0 }}>Admin Panel</h1>
        <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "4px 0 0" }}>
          Kelola form template, sub unit, dan user. Untuk approval KPI, lihat menu Inbox.
        </p>
      </div>

      <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        {sections.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            style={{
              padding: "8px 12px",
              border: `1px solid ${section === key ? COLORS.dark : COLORS.border}`,
              borderRadius: 8,
              background: section === key ? COLORS.dark : COLORS.white,
              color: section === key ? COLORS.white : COLORS.text,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "forms"     && <FormLibrary />}
      {section === "units"     && <UnitManager />}
      {section === "subunits"  && <SubUnitManager />}
      {section === "users"     && <UserManager />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Admin: Approval Inbox
// ──────────────────────────────────────────────────────────────────────────

/**
 * Inbox showing KPI submissions waiting for Owner approval.
 * Owner reviews estimated values, can adjust weights, and approves.
 */
function ApprovalInbox() {
  const store = useDataStore();
  const allPending = useMemo(() => getSubmissions({ status: "estimated" }), [store?.submissions]);
  // Track which submissions have been acted on this session (approved/rejected)
  const [processedIds, setProcessedIds] = useState([]);
  const pending = allPending.filter(p => !processedIds.includes(p.id));
  const [selectedId, setSelectedId] = useState(allPending.length > 0 ? allPending[0].id : null);

  const handleProcessed = (id) => {
    const remaining = pending.filter(p => p.id !== id);
    setProcessedIds(prev => [...prev, id]);
    // Move selection to next pending item
    setSelectedId(remaining.length > 0 ? remaining[0].id : null);
  };

  if (pending.length === 0) {
    return (
      <Card style={{ padding: "40px 20px", textAlign: "center" }}>
        <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}>
          <Icon name="checkCircle" size={40} color={COLORS.success} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.dark }}>Tidak ada KPI menunggu approval</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
          {processedIds.length > 0
            ? `${processedIds.length} KPI sudah diproses sesi ini. Semua estimasi sudah ditangani.`
            : "Semua estimasi KPI dari leader & PIC sudah disetujui."}
        </div>
      </Card>
    );
  }

  const selected = pending.find(p => p.id === selectedId) || pending[0];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 320px) 1fr", gap: 14 }}>
      {/* List */}
      <Card style={{ padding: 0 }}>
        <div style={{
          padding: "12px 14px",
          borderBottom: `1px solid ${COLORS.bgMuted}`,
          background: "#FAFBFC",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.dark, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {pending.length} Menunggu Approval
          </div>
        </div>
        <div>
          {pending.map(sub => (
            <ApprovalListItem
              key={sub.id}
              submission={sub}
              isSelected={sub.id === selected.id}
              onClick={() => setSelectedId(sub.id)}
            />
          ))}
        </div>
      </Card>

      {/* Detail */}
      <ApprovalDetail submission={selected} onProcessed={handleProcessed} />
    </div>
  );
}

function ApprovalListItem({ submission, isSelected, onClick }) {
  const template = getFormTemplate(submission.templateId);
  const subUnit = LIVE.subUnits.find(su => su.id === submission.subUnitId);
  const unit = subUnit ? UNITS[subUnit.unitId] : null;
  const submitter = getUser(submission.createdBy);

  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 14px",
        borderBottom: `1px solid ${COLORS.bgMuted}`,
        borderLeft: isSelected ? `3px solid ${COLORS.primary}` : "3px solid transparent",
        background: isSelected ? COLORS.infoBg : COLORS.white,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        {unit && <Icon name={unit.icon} size={15} color={unit.color} />}
        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark }}>
          {subUnit?.name}
        </span>
      </div>
      <div style={{ fontSize: 11, color: COLORS.text, marginBottom: 3 }}>
        {template?.name}
      </div>
      <div style={{ fontSize: 10, color: COLORS.textMuted }}>
        {submission.period}
      </div>
      <div style={{
        fontSize: 9,
        color: COLORS.textLight,
        marginTop: 4,
        display: "flex",
        justifyContent: "space-between",
      }}>
        <span>Oleh: {submitter?.name}</span>
        <span>{formatDate(submission.createdAt)}</span>
      </div>
    </div>
  );
}

function ApprovalDetail({ submission, onProcessed }) {
  const store = useDataStore();
  const template = getFormTemplate(submission.templateId);
  const subUnit = LIVE.subUnits.find(su => su.id === submission.subUnitId);
  const unit = subUnit ? UNITS[subUnit.unitId] : null;
  const submitter = getUser(submission.createdBy);

  // Initialize weights from template defaults (since not set yet)
  const [weights, setWeights] = useState(() => {
    const w = {};
    template?.fields.forEach(f => {
      if (f.type === "auto" || f.defaultWeight > 0) {
        w[f.id] = f.defaultWeight;
      }
    });
    return w;
  });

  const [subUnitWeight, setSubUnitWeight] = useState(submission.subUnitWeight || 30);
  const [feedback, setFeedback] = useState("");

  // Compute estimated field values
  const computedValues = useMemo(
    () => template ? computeFieldValues(template, submission.estimatedValues) : {},
    [submission.id]
  );

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + Number(w || 0), 0);
  const weightValid = totalWeight === 100;

  const handleApprove = async () => {
    if (!weightValid) {
      alert(`Total bobot KPI harus = 100% (saat ini ${totalWeight}%)`);
      return;
    }
    // Simpan approval ke database: status approved + bobot final, lalu segarkan.
    try {
      await approveSubmission(submission.id, { fieldWeights: { ...weights }, subUnitWeight });
      if (store) store.setSubmissions(await fetchSubmissions());
    } catch (e) {
      alert(e.message || "Gagal menyetujui KPI.");
      return;
    }
    alert(`KPI "${template?.name}" untuk ${subUnit?.name} telah disetujui.\n\nStatus berubah ke "approved", bobot tersimpan, dan KPI keluar dari antrian.`);
    if (onProcessed) onProcessed(submission.id);
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      alert("Mohon isi catatan/koreksi sebelum reject");
      return;
    }
    // Simpan penolakan ke database (status rejected + catatan), lalu segarkan.
    try {
      await rejectSubmission(submission.id, { note: feedback.trim() });
      if (store) store.setSubmissions(await fetchSubmissions());
    } catch (e) {
      alert(e.message || "Gagal menolak KPI.");
      return;
    }
    alert(`KPI ditolak & dikembalikan ke pengaju.\n\nCatatan ke PIC:\n"${feedback}"\n\nKPI keluar dari antrian approval.`);
    if (onProcessed) onProcessed(submission.id);
  };

  if (!template || !subUnit) {
    return <Card style={{ padding: 20 }}>Data submission tidak lengkap</Card>;
  }

  return (
    <Card style={{ padding: 0 }}>
      {/* Header */}
      <div style={{
        padding: "16px 18px",
        borderBottom: `1px solid ${COLORS.bgMuted}`,
        background: `linear-gradient(135deg, ${unit.color}, ${unit.colorDark})`,
        color: COLORS.white,
      }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name={unit.icon} size={13} color="rgba(255,255,255,0.85)" /> {unit.name}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3 }}>
          {subUnit.name} — {template.name}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>{submission.period} • Diajukan oleh <strong>{submitter?.name}</strong> pada {formatDate(submission.createdAt)}
        </div>
      </div>

      {/* Estimated values */}
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${COLORS.bgMuted}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark, marginBottom: 10 }}>Estimasi yang Diajukan
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
          {template.fields.map(field => {
            const value = computedValues[field.name];
            const isAuto = field.type === "auto";

            return (
              <div
                key={field.id}
                style={{
                  padding: "10px 12px",
                  background: isAuto ? COLORS.infoBg : "#FAFBFC",
                  border: `1px solid ${isAuto ? "#C5DBF0" : COLORS.bgMuted}`,
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: 9, color: COLORS.textLight, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>
                  {isAuto && ""}{field.name}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: isAuto ? COLORS.primaryDark : COLORS.dark }}>
                  {formatFieldValue(value, field.satuan, field.type)}
                </div>
                {field.isMargin && (
                  <Pill color={COLORS.success} bg={COLORS.successBg}>Margin</Pill>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Weights setup */}
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${COLORS.bgMuted}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark }}>Atur Bobot KPI
          </div>
          <Pill
            color={weightValid ? COLORS.success : COLORS.danger}
            bg={weightValid ? COLORS.successBg : COLORS.dangerBg}
          >
            Total: {totalWeight}% {weightValid ? "" : "(harus 100%)"}
          </Pill>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          {template.fields.filter(f => weights[f.id] !== undefined).map(field => (
            <div
              key={field.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                background: "#FAFBFC",
                borderRadius: 7,
              }}
            >
              <div style={{ flex: 1, fontSize: 12, color: COLORS.text, fontWeight: 600 }}>
                {field.name}
                <span style={{ color: COLORS.textLight, fontWeight: 400, marginLeft: 5 }}>
                  ({field.satuan})
                </span>
              </div>
              <input
                type="number"
                value={weights[field.id]}
                onChange={e => setWeights({ ...weights, [field.id]: Number(e.target.value) || 0 })}
                min="0"
                max="100"
                style={{
                  width: 60,
                  padding: "5px 8px",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 6,
                  fontSize: 12,
                  textAlign: "right",
                  fontFamily: "inherit",
                }}
              />
              <span style={{ fontSize: 12, color: COLORS.textMuted, minWidth: 12 }}>%</span>
            </div>
          ))}
        </div>

        {/* Sub-unit weight */}
        <div style={{
          marginTop: 12,
          padding: "10px 12px",
          background: unit.colorLight,
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{ flex: 1, fontSize: 12, color: COLORS.text, fontWeight: 600 }}>
            Bobot {subUnit.name} dalam {unit.name}
          </div>
          <input
            type="number"
            value={subUnitWeight}
            onChange={e => setSubUnitWeight(Number(e.target.value) || 0)}
            min="0"
            max="100"
            style={{
              width: 60,
              padding: "5px 8px",
              border: `1px solid ${unit.color}`,
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              textAlign: "right",
              fontFamily: "inherit",
              color: unit.color,
            }}
          />
          <span style={{ fontSize: 12, color: unit.color, fontWeight: 700, minWidth: 12 }}>%</span>
        </div>
      </div>

      {/* Feedback (for reject) */}
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${COLORS.bgMuted}` }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, marginBottom: 5 }}>Catatan / Koreksi (opsional untuk approve, wajib untuk reject)
        </div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          placeholder="Contoh: Target SR terlalu rendah, mohon naikkan ke 85%..."
          style={{
            width: "100%",
            padding: "8px 11px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 7,
            fontSize: 12,
            fontFamily: "inherit",
            resize: "none",
            boxSizing: "border-box",
            display: "block",
          }}
        />
      </div>

      {/* Action buttons */}
      <div style={{
        padding: "14px 18px",
        display: "flex",
        gap: 10,
        justifyContent: "flex-end",
        alignItems: "center",
        borderTop: `1px solid ${COLORS.bgMuted}`,
        position: "relative",
        zIndex: 1,
        background: COLORS.white,
      }}>
        <button
          onClick={handleReject}
          type="button"
          style={{
            padding: "10px 18px",
            background: COLORS.white,
            color: feedback.trim() ? COLORS.danger : COLORS.textLight,
            border: `1px solid ${feedback.trim() ? COLORS.danger : COLORS.border}`,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "color 0.15s, border-color 0.15s",
          }}
          title={feedback.trim() ? "Tolak KPI dengan catatan ini" : "Isi catatan dulu untuk menolak"}
        >
          Reject + Koreksi
        </button>
        <button
          onClick={handleApprove}
          type="button"
          style={{
            padding: "11px 24px",
            background: COLORS.success,
            color: COLORS.white,
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 2px 8px rgba(91,155,71,0.3)",
          }}
        >
          <Icon name="check" size={16} color={COLORS.white} style={{ pointerEvents: "none" }} />
          Approve KPI
        </button>
      </div>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Admin: Form Builder (rancang KPI template dari nol)
// Tahap 1: kerangka + field manual (nama, satuan, tipe, bobot, margin)
// ──────────────────────────────────────────────────────────────────────────

const SATUAN_OPTIONS = ["", "Rp", "Rp/kg", "%", "x", "ekor", "kg", "gr", "orang", "unit", "hari", "trx"];

/**
 * Convert an existing FORM_TEMPLATES entry into FormBuilder's working data shape.
 * Auto fields are mapped to "advanced" mode using the formula's readable text
 * (× → *, ÷ → /), so the duplicated template is immediately editable & testable.
 */
function templateToBuilderData(template) {
  let k = 1;
  const fields = template.fields.map(f => {
    const isFormula = f.type === "auto" || f.source === "Formula";
    let formulaText = "";
    if (isFormula && f.formulaId) {
      const formula = getFormula(f.formulaId);
      if (formula && formula.formula) {
        formulaText = formula.formula
          .replace(/×/g, "*")
          .replace(/÷/g, "/");
      }
    }
    return {
      key: k++,
      name: f.name,
      satuan: f.satuan || "",
      source: isFormula ? "Formula" : "Manual",
      weight: f.defaultWeight || 0,
      isMargin: !!f.isMargin,
      formulaMode: isFormula ? "advanced" : "easy",
      formulaSteps: [{ operand: "", operandType: "field", operator: "+" }],
      formulaText,
    };
  });
  return {
    name: `${template.name} (Copy)`,
    desc: template.description || "",
    freq: template.frequency || "cycle",
    fields,
    keyCounter: k,
  };
}

/**
 * FormBuilder — full-screen overlay to design a new KPI template.
 * Everything is user-defined: field names, units, type, weights, margin flag.
 * Nothing is hardcoded — this is the engine that produces templates.
 * `initialData` (optional) pre-fills the builder, e.g. when duplicating a template.
 */
function FormBuilder({ onClose, initialData }) {
  const store = useDataStore();
  const [name, setName] = useState(initialData?.name || "");
  const [desc, setDesc] = useState(initialData?.desc || "");
  const [freq, setFreq] = useState(initialData?.freq || "cycle");

  // Each field: { key, name, satuan, source, weight, isMargin, formulaMode, formulaSteps, formulaText }
  const [fields, setFields] = useState(
    initialData?.fields && initialData.fields.length > 0
      ? initialData.fields
      : [{ key: 1, name: "", satuan: "", source: "Manual", weight: 0, isMargin: false, formulaMode: "easy", formulaSteps: [{ operand: "", operandType: "field", operator: "+" }], formulaText: "" }]
  );
  const [keyCounter, setKeyCounter] = useState(initialData?.keyCounter || 2);

  const addField = () => {
    setFields([...fields, { key: keyCounter, name: "", satuan: "", source: "Manual", weight: 0, isMargin: false, formulaMode: "easy", formulaSteps: [{ operand: "", operandType: "field", operator: "+" }], formulaText: "" }]);
    setKeyCounter(keyCounter + 1);
  };

  const removeField = (key) => {
    if (fields.length === 1) { alert("Template minimal punya 1 field"); return; }
    setFields(fields.filter(f => f.key !== key));
  };

  const updateField = (key, prop, value) => {
    setFields(fields.map(f => {
      if (f.key !== key) {
        // Only one margin field allowed: uncheck others when one is set
        if (prop === "isMargin" && value === true) return { ...f, isMargin: false };
        return f;
      }
      return { ...f, [prop]: value };
    }));
  };

  const moveField = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[idx], next[target]] = [next[target], next[idx]];
    setFields(next);
  };

  // ─── Formula step handlers (mode mudah) ───
  const updateStep = (fieldKey, stepIdx, prop, value) => {
    setFields(fields.map(f => {
      if (f.key !== fieldKey) return f;
      const steps = f.formulaSteps.map((s, i) => i === stepIdx ? { ...s, [prop]: value } : s);
      return { ...f, formulaSteps: steps };
    }));
  };

  const addStep = (fieldKey) => {
    setFields(fields.map(f => {
      if (f.key !== fieldKey) return f;
      return { ...f, formulaSteps: [...f.formulaSteps, { operand: "", operandType: "field", operator: "+" }] };
    }));
  };

  const removeStep = (fieldKey, stepIdx) => {
    setFields(fields.map(f => {
      if (f.key !== fieldKey) return f;
      if (f.formulaSteps.length === 1) return f;
      return { ...f, formulaSteps: f.formulaSteps.filter((_, i) => i !== stepIdx) };
    }));
  };

  // Build a readable preview of an easy-mode formula
  const opSymbol = { "+": "+", "-": "−", "*": "×", "/": "÷" };
  const buildEasyPreview = (f) => {
    const parts = [];
    f.formulaSteps.forEach((s, i) => {
      const val = s.operand === "" ? "?" : s.operand;
      if (i === 0) parts.push(val);
      else parts.push(`${opSymbol[s.operator] || s.operator} ${val}`);
    });
    return parts.join(" ");
  };

  // Fields available to reference in a formula (manual + earlier-defined fields, excluding self)
  const refOptionsFor = (fieldKey) =>
    fields.filter(f => f.key !== fieldKey && f.name.trim());

  const totalWeight = fields.reduce((sum, f) => sum + (Number(f.weight) || 0), 0);

  // Convert an easy-mode field's steps to an arithmetic expression string
  const easyToExpr = (f) => {
    const tokens = [];
    f.formulaSteps.forEach((s, i) => {
      const operand = s.operandType === "field" ? `(${s.operand})` : String(s.operand);
      if (i === 0) tokens.push(operand);
      else tokens.push(s.operator, operand);
    });
    return tokens.join(" ");
  };

  // The effective expression for a formula field (easy → derived, advanced → typed text)
  const exprForField = (f) =>
    f.formulaMode === "advanced" ? (f.formulaText || "") : easyToExpr(f);

  // ─── Live preview (uji nilai) ───
  const [showPreview, setShowPreview] = useState(false);
  const [testValues, setTestValues] = useState({}); // { [fieldKey]: number } for manual fields

  const manualFieldsList = fields.filter(f => f.source === "Manual" && f.name.trim());

  // Compute all field values from test inputs, resolving formula dependencies (up to N passes)
  const computePreview = () => {
    const byName = {}; // name -> value
    // seed manual values
    fields.forEach(f => {
      if (f.source === "Manual") {
        const v = testValues[f.key];
        byName[f.name] = v === undefined || v === "" ? 0 : Number(v);
      }
    });
    const results = {};   // fieldKey -> { value, error }
    const formulaFields = fields.filter(f => f.source === "Formula" && f.name.trim());

    // Iterative resolution (handle chained dependencies)
    const maxPasses = formulaFields.length + 1;
    for (let pass = 0; pass < maxPasses; pass++) {
      formulaFields.forEach(f => {
        const expr = exprForField(f);
        const r = evalFormula(expr, byName);
        if (r.ok) {
          byName[f.name] = r.value;
          results[f.key] = { value: r.value, error: null };
        } else {
          results[f.key] = { value: null, error: r.error };
        }
      });
    }
    return { byName, results };
  };

  const preview = showPreview ? computePreview() : null;

  const handleSave = () => {
    if (!name.trim()) { alert("Isi nama template"); return; }
    const emptyField = fields.find(f => !f.name.trim());
    if (emptyField) { alert("Setiap field wajib punya nama"); return; }
    // Field names must NOT contain spaces (used as formula variables → must be precise)
    const spacedField = fields.find(f => /\s/.test(f.name));
    if (spacedField) {
      alert(`Nama variabel tidak boleh ada spasi: "${spacedField.name}".\nGunakan underscore, contoh: Total_Biaya`);
      return;
    }
    // Names must be unique (so formulas can reference them later)
    const names = fields.map(f => f.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      alert("Nama field tidak boleh ada yang sama (akan dipakai sebagai acuan rumus)"); return;
    }
    // Validate formulas for auto fields (both modes)
    for (const f of fields) {
      if (f.source !== "Formula") continue;
      if (f.formulaMode === "easy") {
        const incomplete = f.formulaSteps.some(s => s.operand === "" || s.operand === null);
        if (incomplete) {
          alert(`Field otomatis "${f.name}" punya rumus (mode mudah) yang belum lengkap. Isi semua operand atau hapus langkah kosong.`);
          return;
        }
      } else {
        // advanced: validate against known field names
        const refMap = {};
        fields.forEach(rf => { if (rf.name.trim()) refMap[rf.name] = 1; });
        const r = evalFormula(f.formulaText || "", refMap);
        if (!r.ok) {
          alert(`Rumus field "${f.name}" (mode lanjutan) belum valid:\n${r.error}`);
          return;
        }
      }
    }
    if (totalWeight !== 100 && totalWeight !== 0) {
      if (!confirm(`Total bobot KPI = ${totalWeight}% (idealnya 100%).\n\nLanjut simpan?`)) return;
    }

    const fieldSummary = fields
      .map((f, i) => {
        const base = `  ${i + 1}. ${f.name}${f.satuan ? ` (${f.satuan})` : ""} — ${f.source}${f.weight > 0 ? `, bobot ${f.weight}%` : ""}${f.isMargin ? ", [MARGIN]" : ""}`;
        if (f.source === "Formula") {
          return `${base}\n       = ${exprForField(f) || "(rumus kosong)"}`;
        }
        return base;
      })
      .join("\n");

    // Convert builder fields → template field shape.
    // Formula fields store their expression directly (formulaExpr), evaluated by
    // computeFieldValues — so user templates need no FORMULA_LIBRARY entry.
    const templateFields = fields.map((f, i) => {
      const isFormula = f.source === "Formula";
      return {
        id: `f${i + 1}`,
        name: f.name.trim(),
        type: isFormula ? "auto" : "number",
        satuan: f.satuan || "",
        source: isFormula ? "Formula" : "Manual",
        formulaId: null,
        formulaExpr: isFormula ? exprForField(f) : null,
        defaultWeight: Number(f.weight) || 0,
        isMargin: !!f.isMargin,
      };
    });

    const isEdit = !!initialData?.editId;
    const templateObj = {
      id: isEdit ? initialData.editId : `tpl-${Date.now()}`,
      name: name.trim(),
      description: desc.trim(),
      frequency: freq,
      createdAt: new Date().toISOString().slice(0, 10),
      fields: templateFields,
    };

    if (store) {
      if (isEdit) {
        store.setTemplates(prev => prev.map(t => t.id === templateObj.id ? templateObj : t));
      } else {
        store.setTemplates(prev => [...prev, templateObj]);
      }
    }

    alert(
      (isEdit ? "Template diperbarui." : "Template baru berhasil dibuat.") + "\n\n" +
      `Nama: ${name}\n` +
      `Frekuensi: ${freq === "monthly" ? "Bulanan" : freq === "cycle" ? "Per Siklus" : "Per Event"}\n` +
      `Jumlah field: ${fields.length}\n` +
      `Total bobot: ${totalWeight}%\n\n` +
      `Field:\n${fieldSummary}\n\n` +
      "Template sekarang muncul di Template Manager & pilihan saat Ajukan KPI."
    );
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(20,20,26,0.55)",
      zIndex: 1000,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "24px 16px",
      overflowY: "auto",
    }}>
      <div style={{
        background: COLORS.white,
        borderRadius: 14,
        width: "100%",
        maxWidth: 900,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          background: `linear-gradient(135deg, ${COLORS.dark}, ${COLORS.darker})`,
          color: COLORS.white,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="cog" size={20} color={COLORS.gold} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Form Builder — Rancang KPI Baru</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                Semua variabel bisa Bapak tentukan sendiri
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(255,255,255,0.12)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name="x" size={16} color={COLORS.white} />
          </button>
        </div>

        <div style={{ padding: "18px 20px", maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
          {/* Info dasar */}
          <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.dark, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
            1. Info Template
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Nama Template <span style={{ color: COLORS.danger }}>*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="cth: KPI Marketing, Kolam Pembenihan, dll"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Frekuensi</label>
              <select value={freq} onChange={e => setFreq(e.target.value)} style={inputStyle}>
                <option value="monthly">Bulanan</option>
                <option value="cycle">Per Siklus</option>
                <option value="event">Per Event</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Deskripsi</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              placeholder="Untuk apa template KPI ini dipakai..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Field builder */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.dark, textTransform: "uppercase", letterSpacing: 0.5 }}>
              2. Variabel / Field ({fields.length})
            </div>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 99,
              background: totalWeight === 100 ? COLORS.successBg : COLORS.bgMuted,
              color: totalWeight === 100 ? COLORS.success : COLORS.textMuted,
            }}>
              Total bobot: {totalWeight}%
            </div>
          </div>

          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "44px 1fr 90px 110px 70px 70px 30px",
            gap: 6,
            padding: "0 2px 6px",
            fontSize: 9,
            fontWeight: 700,
            color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}>
            <div>Urut</div>
            <div>Nama Variabel</div>
            <div>Satuan</div>
            <div>Sumber</div>
            <div>Bobot %</div>
            <div>Margin</div>
            <div></div>
          </div>

          {/* Field rows */}
          {fields.map((f, idx) => (
            <div key={f.key} style={{ marginBottom: f.source === "Formula" ? 4 : 0 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr 90px 110px 70px 70px 30px",
                gap: 6,
                padding: "5px 2px",
                alignItems: "center",
                background: f.source === "Formula" ? COLORS.infoBg : "transparent",
                borderRadius: 7,
              }}
            >
              {/* Reorder */}
              <div style={{ display: "flex", gap: 2 }}>
                <button
                  onClick={() => moveField(idx, -1)}
                  type="button"
                  disabled={idx === 0}
                  title="Naik"
                  style={{
                    width: 20, height: 20, padding: 0,
                    background: COLORS.white,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 4,
                    cursor: idx === 0 ? "not-allowed" : "pointer",
                    opacity: idx === 0 ? 0.4 : 1,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 9, color: COLORS.textMuted }}>▲</span>
                </button>
                <button
                  onClick={() => moveField(idx, 1)}
                  type="button"
                  disabled={idx === fields.length - 1}
                  title="Turun"
                  style={{
                    width: 20, height: 20, padding: 0,
                    background: COLORS.white,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 4,
                    cursor: idx === fields.length - 1 ? "not-allowed" : "pointer",
                    opacity: idx === fields.length - 1 ? 0.4 : 1,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 9, color: COLORS.textMuted }}>▼</span>
                </button>
              </div>

              {/* Nama (tanpa spasi — spasi otomatis jadi underscore) */}
              <input
                type="text"
                value={f.name}
                onChange={e => updateField(f.key, "name", e.target.value.replace(/\s+/g, "_"))}
                placeholder="cth: Total_Biaya"
                style={{ ...inputStyle, padding: "7px 9px", fontSize: 12 }}
              />

              {/* Satuan */}
              <select
                value={f.satuan}
                onChange={e => updateField(f.key, "satuan", e.target.value)}
                style={{ ...inputStyle, padding: "7px 6px", fontSize: 12 }}
              >
                {SATUAN_OPTIONS.map(s => (
                  <option key={s} value={s}>{s === "" ? "—" : s}</option>
                ))}
              </select>

              {/* Sumber */}
              <select
                value={f.source}
                onChange={e => updateField(f.key, "source", e.target.value)}
                style={{ ...inputStyle, padding: "7px 6px", fontSize: 12 }}
              >
                <option value="Manual">Manual</option>
                <option value="Formula">Otomatis</option>
              </select>

              {/* Bobot */}
              <input
                type="number"
                value={f.weight}
                onChange={e => updateField(f.key, "weight", e.target.value === "" ? 0 : Number(e.target.value))}
                min={0}
                max={100}
                style={{ ...inputStyle, padding: "7px 8px", fontSize: 12 }}
              />

              {/* Margin */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  onClick={() => updateField(f.key, "isMargin", !f.isMargin)}
                  type="button"
                  title="Tandai sebagai field Margin"
                  style={{
                    width: 22, height: 22, borderRadius: 5, padding: 0,
                    border: `2px solid ${f.isMargin ? COLORS.success : COLORS.border}`,
                    background: f.isMargin ? COLORS.success : COLORS.white,
                    cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {f.isMargin && <Icon name="check" size={12} color={COLORS.white} strokeWidth={3} />}
                </button>
              </div>

              {/* Hapus */}
              <button
                onClick={() => removeField(f.key)}
                type="button"
                title="Hapus field"
                style={{
                  width: 26, height: 26, padding: 0,
                  background: "transparent", border: "none",
                  cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name="trash" size={14} color={COLORS.danger} />
              </button>
            </div>

            {/* Formula editor — only for Otomatis fields */}
            {f.source === "Formula" && (
              <div style={{
                margin: "0 2px 6px",
                padding: "10px 12px",
                background: COLORS.infoBg,
                border: `1px solid #C5DBF0`,
                borderRadius: 8,
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  gap: 8,
                  flexWrap: "wrap",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.primaryDark, textTransform: "uppercase", letterSpacing: 0.4 }}>
                    Rumus untuk "{f.name || "(belum diberi nama)"}"
                  </div>
                  {/* Mode toggle */}
                  <div style={{ display: "flex", gap: 0, border: `1px solid #C5DBF0`, borderRadius: 6, overflow: "hidden" }}>
                    <button
                      type="button"
                      onClick={() => updateField(f.key, "formulaMode", "easy")}
                      style={{
                        padding: "4px 10px", fontSize: 10, fontWeight: 700,
                        border: "none", cursor: "pointer", fontFamily: "inherit",
                        background: f.formulaMode !== "advanced" ? COLORS.primary : COLORS.white,
                        color: f.formulaMode !== "advanced" ? COLORS.white : COLORS.textMuted,
                      }}
                    >Mode Mudah</button>
                    <button
                      type="button"
                      onClick={() => updateField(f.key, "formulaMode", "advanced")}
                      style={{
                        padding: "4px 10px", fontSize: 10, fontWeight: 700,
                        border: "none", cursor: "pointer", fontFamily: "inherit",
                        background: f.formulaMode === "advanced" ? COLORS.primary : COLORS.white,
                        color: f.formulaMode === "advanced" ? COLORS.white : COLORS.textMuted,
                      }}
                    >Mode Lanjutan</button>
                  </div>
                </div>

                {/* Live preview of the resulting expression */}
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.primaryDark,
                  background: COLORS.white,
                  padding: "5px 9px",
                  borderRadius: 6,
                  border: `1px solid #C5DBF0`,
                  marginBottom: 8,
                  wordBreak: "break-word",
                }}>
                  {f.name || "hasil"} = {f.formulaMode === "advanced" ? (f.formulaText || "(kosong)") : buildEasyPreview(f)}
                </div>

                {/* ADVANCED MODE: free-text formula */}
                {f.formulaMode === "advanced" ? (
                  <div>
                    <textarea
                      value={f.formulaText}
                      onChange={e => updateField(f.key, "formulaText", e.target.value)}
                      rows={2}
                      placeholder="cth: (Tebar * SR / 100) * Bobot_per_Ekor / 1000"
                      style={{ ...inputStyle, fontSize: 12, fontFamily: "monospace", resize: "vertical" }}
                    />
                    {/* Validation hint */}
                    {(() => {
                      const refMap = {};
                      fields.forEach(rf => { if (rf.name.trim()) refMap[rf.name] = 1; });
                      const r = evalFormula(f.formulaText || "", refMap);
                      if (!f.formulaText || !f.formulaText.trim()) {
                        return <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 5 }}>Ketik rumus pakai nama field, angka, dan operator + − * / ( )</div>;
                      }
                      return r.ok
                        ? <div style={{ fontSize: 10, color: COLORS.success, marginTop: 5, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}><Icon name="checkCircle" size={12} color={COLORS.success} /> Rumus valid secara struktur</div>
                        : <div style={{ fontSize: 10, color: COLORS.danger, marginTop: 5, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}><Icon name="warning" size={12} color={COLORS.danger} /> {r.error}</div>;
                    })()}
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 8, marginBottom: 4 }}>
                      Klik field untuk menyisipkan ke rumus:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {refOptionsFor(f.key).length === 0 ? (
                        <span style={{ fontSize: 10, color: COLORS.textLight }}>(belum ada field lain)</span>
                      ) : (
                        refOptionsFor(f.key).map(rf => (
                          <button
                            key={rf.key}
                            type="button"
                            onClick={() => {
                              const cur = f.formulaText || "";
                              // Add a space before the name if needed so tokens don't stick together
                              const sep = cur && !/[\s(]$/.test(cur) ? " " : "";
                              updateField(f.key, "formulaText", cur + sep + rf.name + " ");
                            }}
                            style={{
                              fontSize: 10.5,
                              fontFamily: "monospace",
                              fontWeight: 700,
                              color: COLORS.primaryDark,
                              background: COLORS.infoBg,
                              border: `1px solid #C5DBF0`,
                              borderRadius: 6,
                              padding: "3px 8px",
                              cursor: "pointer",
                            }}
                          >{rf.name}</button>
                        ))
                      )}
                    </div>
                    {/* Operator buttons */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                      {["+", "−", "×", "÷", "(", ")"].map(op => {
                        const real = op === "−" ? "-" : op === "×" ? "*" : op === "÷" ? "/" : op;
                        return (
                          <button
                            key={op}
                            type="button"
                            onClick={() => {
                              const cur = f.formulaText || "";
                              const sep = cur && !/[\s(]$/.test(cur) && real !== ")" ? " " : "";
                              updateField(f.key, "formulaText", cur + sep + real + " ");
                            }}
                            style={{
                              fontSize: 12,
                              fontFamily: "monospace",
                              fontWeight: 800,
                              color: COLORS.text,
                              background: COLORS.bgMuted,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: 6,
                              padding: "3px 10px",
                              cursor: "pointer",
                            }}
                          >{op}</button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => updateField(f.key, "formulaText", "")}
                        style={{
                          fontSize: 10.5, fontWeight: 700, color: COLORS.danger,
                          background: COLORS.white, border: `1px solid ${COLORS.border}`,
                          borderRadius: 6, padding: "3px 10px", cursor: "pointer", marginLeft: "auto",
                        }}
                      >Hapus rumus</button>
                    </div>
                  </div>
                ) : (
                <>
                {/* Steps */}
                {f.formulaSteps.map((step, sIdx) => (
                  <div key={sIdx} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    {sIdx === 0 ? (
                      <div style={{ width: 54, fontSize: 11, color: COLORS.textMuted, fontWeight: 700, textAlign: "center" }}>
                        mulai:
                      </div>
                    ) : (
                      <select
                        value={step.operator}
                        onChange={e => updateStep(f.key, sIdx, "operator", e.target.value)}
                        style={{ ...inputStyle, padding: "6px 4px", fontSize: 14, width: 54, textAlign: "center", fontWeight: 700 }}
                      >
                        <option value="+">+</option>
                        <option value="-">−</option>
                        <option value="*">×</option>
                        <option value="/">÷</option>
                      </select>
                    )}

                    <select
                      value={step.operandType}
                      onChange={e => updateStep(f.key, sIdx, "operandType", e.target.value)}
                      style={{ ...inputStyle, padding: "6px 6px", fontSize: 11, width: 95 }}
                    >
                      <option value="field">Field</option>
                      <option value="number">Angka</option>
                    </select>

                    {step.operandType === "field" ? (
                      <select
                        value={step.operand}
                        onChange={e => updateStep(f.key, sIdx, "operand", e.target.value)}
                        style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, flex: 1 }}
                      >
                        <option value="">— pilih field —</option>
                        {refOptionsFor(f.key).map(rf => (
                          <option key={rf.key} value={rf.name}>{rf.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={step.operand}
                        onChange={e => updateStep(f.key, sIdx, "operand", e.target.value)}
                        placeholder="cth: 100"
                        style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, flex: 1 }}
                      />
                    )}

                    <button
                      onClick={() => removeStep(f.key, sIdx)}
                      type="button"
                      disabled={f.formulaSteps.length === 1}
                      title="Hapus langkah"
                      style={{
                        width: 26, height: 26, padding: 0,
                        background: "transparent", border: "none",
                        cursor: f.formulaSteps.length === 1 ? "not-allowed" : "pointer",
                        opacity: f.formulaSteps.length === 1 ? 0.3 : 1,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="x" size={14} color={COLORS.danger} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addStep(f.key)}
                  type="button"
                  style={{
                    marginTop: 2,
                    padding: "5px 10px",
                    background: COLORS.white,
                    color: COLORS.primary,
                    border: `1px dashed ${COLORS.primary}`,
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Icon name="plus" size={11} color={COLORS.primary} />
                  Tambah langkah
                </button>

                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 7, fontStyle: "italic" }}>
                  Dihitung berurutan kiri ke kanan. Untuk rumus berkurung kompleks, gunakan Mode Lanjutan.
                </div>
                </>
                )}
              </div>
            )}
            </div>
          ))}

          {/* Add field */}
          <button
            onClick={addField}
            type="button"
            style={{
              marginTop: 10,
              padding: "8px 14px",
              background: COLORS.white,
              color: COLORS.primary,
              border: `1px dashed ${COLORS.primary}`,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Icon name="plus" size={14} color={COLORS.primary} />
            Tambah Variabel
          </button>

          {/* Note about formula (Tahap 2) */}
          {/* ─── 3. Uji Nilai (Preview) ─── */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.dark, textTransform: "uppercase", letterSpacing: 0.5 }}>
                3. Uji Nilai (Preview Hitung)
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  padding: "6px 12px",
                  background: showPreview ? COLORS.primary : COLORS.white,
                  color: showPreview ? COLORS.white : COLORS.primary,
                  border: `1px solid ${COLORS.primary}`,
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Icon name={showPreview ? "eye" : "play"} size={13} color={showPreview ? COLORS.white : COLORS.primary} />
                {showPreview ? "Tutup Preview" : "Uji Rumus"}
              </button>
            </div>

            {showPreview && (
              <div style={{
                padding: "14px 16px",
                background: COLORS.bgMuted,
                borderRadius: 10,
                border: `1px solid ${COLORS.border}`,
              }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10 }}>
                  Isi nilai contoh untuk field manual, lalu lihat hasil perhitungan field otomatis. Ini menguji rumus Bapak <strong>sebelum</strong> template disimpan.
                </div>

                {manualFieldsList.length === 0 ? (
                  <div style={{ fontSize: 11, color: COLORS.textLight, fontStyle: "italic", padding: "8px 0" }}>
                    Belum ada field manual untuk diisi. Tambahkan field manual dulu.
                  </div>
                ) : (
                  <>
                    {/* Manual inputs */}
                    <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
                      Input (Field Manual)
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                      {manualFieldsList.map(f => (
                        <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <label style={{ fontSize: 11, color: COLORS.text, flex: 1, fontWeight: 600 }}>
                            {f.name}{f.satuan ? ` (${f.satuan})` : ""}
                          </label>
                          <input
                            type="number"
                            value={testValues[f.key] ?? ""}
                            onChange={e => setTestValues({ ...testValues, [f.key]: e.target.value })}
                            placeholder="0"
                            style={{ ...inputStyle, padding: "6px 9px", fontSize: 12, width: 110 }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Computed results */}
                    <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
                      Hasil (Field Otomatis)
                    </div>
                    {fields.filter(f => f.source === "Formula" && f.name.trim()).length === 0 ? (
                      <div style={{ fontSize: 11, color: COLORS.textLight, fontStyle: "italic" }}>
                        Belum ada field otomatis.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {fields.filter(f => f.source === "Formula" && f.name.trim()).map(f => {
                          const res = preview?.results[f.key];
                          const hasErr = res && res.error;
                          return (
                            <div key={f.key} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              background: COLORS.white,
                              border: `1px solid ${hasErr ? COLORS.danger : COLORS.border}`,
                              borderRadius: 7,
                            }}>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark }}>
                                  {f.name}{f.satuan ? ` (${f.satuan})` : ""}
                                  {f.isMargin && <span style={{ marginLeft: 6 }}><Pill color={COLORS.success} bg={COLORS.successBg}>Margin</Pill></span>}
                                </div>
                                <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "monospace", marginTop: 2 }}>
                                  = {exprForField(f) || "(kosong)"}
                                </div>
                              </div>
                              <div style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: hasErr ? COLORS.danger : COLORS.primary,
                                textAlign: "right",
                              }}>
                                {hasErr
                                  ? <span style={{ fontSize: 10, fontWeight: 700 }}>{res.error}</span>
                                  : (res ? formatFieldValue(res.value, f.satuan, "number") : "—")}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: "14px 20px",
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: COLORS.bg,
        }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>
            {fields.filter(f => f.source === "Formula").length} field otomatis • {fields.filter(f => f.source === "Manual").length} field manual
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} type="button" style={adminBtnStyle}>Batal</button>
            <button
              onClick={handleSave}
              type="button"
              style={{
                padding: "9px 22px",
                background: COLORS.primary,
                color: COLORS.white,
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <Icon name="save" size={15} color={COLORS.white} />
              Simpan Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Admin: Form Library
// ──────────────────────────────────────────────────────────────────────────

/**
 * Form Library — view all form templates Bapak created.
 * Templates are reusable across sub-units.
 */
function FormLibrary() {
  const store = useDataStore(); // subscribe so new templates appear immediately
  const [selectedId, setSelectedId] = useState(LIVE.templates[0]?.id || null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderInit, setBuilderInit] = useState(null); // null = blank new template
  const selected = LIVE.templates.find(t => t.id === selectedId);

  const openNewTemplate = () => {
    setBuilderInit(null);
    setShowBuilder(true);
  };

  const openDuplicate = (template) => {
    setBuilderInit(templateToBuilderData(template));
    setShowBuilder(true);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 300px) 1fr", gap: 14 }}>
      {/* List */}
      <Card style={{ padding: 0 }}>
        <div style={{
          padding: "12px 14px",
          borderBottom: `1px solid ${COLORS.bgMuted}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.dark, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {LIVE.templates.length} Template
          </div>
          <button
            onClick={openNewTemplate}
            type="button"
            style={{
              padding: "7px 13px",
              background: COLORS.primary,
              color: COLORS.white,
              border: "none",
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Icon name="plus" size={13} color={COLORS.white} />
            Buat Template
          </button>
        </div>
        <div>
          {LIVE.templates.map(t => (
            <FormTemplateListItem
              key={t.id}
              template={t}
              isSelected={t.id === selectedId}
              onClick={() => setSelectedId(t.id)}
            />
          ))}
        </div>
      </Card>

      {/* Detail */}
      {selected ? <FormTemplateDetail template={selected} onDuplicate={() => openDuplicate(selected)} /> : null}

      {/* Form Builder modal */}
      {showBuilder && (
        <FormBuilder
          onClose={() => { setShowBuilder(false); setBuilderInit(null); }}
          initialData={builderInit}
        />
      )}
    </div>
  );
}

function FormTemplateListItem({ template, isSelected, onClick }) {
  const FREQUENCY_LABELS = {
    monthly: { label: "Bulanan", icon: "calendar", color: COLORS.primary },
    cycle:   { label: "Per Siklus", icon: "clock", color: COLORS.warning },
    event:   { label: "Per Event", icon: "play", color: COLORS.secondary },
  };
  const freq = FREQUENCY_LABELS[template.frequency];

  // Count usage
  const usageCount = LIVE.submissions.filter(s => s.templateId === template.id).length;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 14px",
        borderBottom: `1px solid ${COLORS.bgMuted}`,
        borderLeft: isSelected ? `3px solid ${COLORS.primary}` : "3px solid transparent",
        background: isSelected ? COLORS.infoBg : COLORS.white,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Icon name={freq.icon} size={14} color={freq.color} />
        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark }}>
          {template.name}
        </span>
      </div>
      <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>
        {template.description}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Pill color={freq.color} bg={freq.color === COLORS.primary ? COLORS.infoBg : freq.color === COLORS.warning ? COLORS.warningBg : COLORS.goldLight}>
          {freq.label}
        </Pill>
        <span style={{ fontSize: 10, color: COLORS.textLight }}>
          {template.fields.length} field • {usageCount}× pakai
        </span>
      </div>
    </div>
  );
}

function FormTemplateDetail({ template, onDuplicate }) {
  const store = useDataStore();
  const manualFields = template.fields.filter(f => f.type !== "auto");
  const autoFields = template.fields.filter(f => f.type === "auto");
  const marginField = template.fields.find(f => f.isMargin);
  const usageCount = LIVE.submissions.filter(s => s.templateId === template.id).length;
  const isUsed = usageCount > 0;

  return (
    <Card style={{ padding: 0 }}>
      {/* Header */}
      <div style={{
        padding: "16px 18px",
        borderBottom: `1px solid ${COLORS.bgMuted}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.dark }}>
            {template.name}
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>
            {template.description}
          </div>
          <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 4 }}>
            Dibuat: {formatDate(template.createdAt)}
            {" • "}
            Frekuensi: <strong>{template.frequency}</strong>
            {" • "}
            {template.fields.length} field
            {" • "}
            {usageCount}× dipakai
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={onDuplicate}
            type="button"
            style={adminBtnStyle}
          >Duplikat</button>
          {isUsed ? (
            <button
              type="button"
              disabled
              title={`Tidak bisa dihapus — sudah dipakai di ${usageCount} KPI`}
              style={{
                ...adminBtnStyle,
                color: COLORS.textLight,
                borderColor: COLORS.border,
                background: COLORS.bgMuted,
                cursor: "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Icon name="lock" size={12} color={COLORS.textLight} />
              Terkunci
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm(`Hapus template "${template.name}"?\n\nTemplate ini belum dipakai di KPI manapun, jadi aman dihapus.`)) {
                  if (store) store.setTemplates(prev => prev.filter(t => t.id !== template.id));
                  alert(`Template "${template.name}" dihapus.`);
                }
              }}
              type="button"
              style={adminBtnDanger}
            >Hapus</button>
          )}
        </div>
      </div>

      {/* Usage warning banner */}
      {isUsed && (
        <div style={{
          padding: "10px 18px",
          background: COLORS.warningBg,
          borderBottom: `1px solid #EBD9B4`,
          fontSize: 11,
          color: "#8A6420",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <Icon name="warning" size={14} color="#8A6420" />
          <span>
            Template ini sudah dipakai di <strong>{usageCount} KPI</strong>, jadi tidak bisa diedit atau dihapus demi menjaga data yang berjalan. Untuk perubahan, gunakan <strong>Duplikat</strong> lalu modifikasi salinannya.
          </span>
        </div>
      )}

      {/* Manual fields */}
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${COLORS.bgMuted}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.dark, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Field Input Manual ({manualFields.length})
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
          {manualFields.map(field => (
            <FormFieldCard key={field.id} field={field} />
          ))}
        </div>
      </div>

      {/* Auto fields */}
      {autoFields.length > 0 && (
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${COLORS.bgMuted}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.dark, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Field Auto-Calculate ({autoFields.length})
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {autoFields.map(field => {
              const formula = getFormula(field.formulaId);
              return (
                <div
                  key={field.id}
                  style={{
                    padding: "10px 12px",
                    background: COLORS.infoBg,
                    border: "1px solid #C5DBF0",
                    borderRadius: 7,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primaryDark }}>{field.name}
                      <span style={{ color: COLORS.textMuted, fontWeight: 400, marginLeft: 5 }}>
                        ({field.satuan})
                      </span>
                      {field.isMargin && (
                        <Pill color={COLORS.success} bg={COLORS.successBg}>Margin</Pill>
                      )}
                    </div>
                    {formula && (
                      <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 3, fontFamily: "monospace" }}>
                        = {formula.formula}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textLight }}>
                    Default: {field.defaultWeight}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info footer */}
      <div style={{
        padding: "10px 14px",
        background: marginField ? "#F0FDF4" : "#FFFBEB",
        borderTop: `1px solid ${marginField ? "#BBF7D0" : "#FDE68A"}`,
        fontSize: 10,
        color: marginField ? "#065F46" : "#92400E",
      }}>
        {marginField
          ? <>Variabel margin: <strong>{marginField.name}</strong> — akan diakumulasi ke dashboard margin unit.</>
          : <>Template ini belum punya variabel margin. Margin tidak akan masuk ke dashboard.</>
        }
      </div>
    </Card>
  );
}

function FormFieldCard({ field }) {
  const SOURCE_COLORS = {
    "Manual":    { bg: "#FAFBFC", color: COLORS.textMuted },
    "Apl Pakan": { bg: "#FEF3C7", color: "#92400E" },
    "Pembukuan": { bg: COLORS.infoBg, color: COLORS.primaryDark },
    "Formula":   { bg: COLORS.goldLight, color: "#5B21B6" },
  };
  const s = SOURCE_COLORS[field.source] || SOURCE_COLORS.Manual;

  return (
    <div style={{
      padding: "9px 11px",
      background: s.bg,
      borderRadius: 7,
      border: `1px solid ${COLORS.bgMuted}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.dark, marginBottom: 3 }}>
        {field.name}
        {field.isMargin && <span style={{ marginLeft: 4 }}></span>}
      </div>
      <div style={{ fontSize: 9, color: s.color, fontWeight: 600 }}>
        {field.satuan && <>{field.satuan} • </>}
        {field.source}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Admin: Unit Manager (tambah / edit / hapus unit bisnis)
// ──────────────────────────────────────────────────────────────────────────

const UNIT_COLOR_OPTIONS = [
  { name: "Biru Air",   color: "#3B7BC4", dark: "#2C5F9E", light: "#E7F0F8" },
  { name: "Hijau",      color: "#5B9B47", dark: "#3F6E31", light: "#EAF3E5" },
  { name: "Tosca",      color: "#3B9BA4", dark: "#2A6E75", light: "#E4F2F3" },
  { name: "Emas",       color: "#C9A45C", dark: "#9A7B3E", light: "#F4ECDB" },
  { name: "Ungu",       color: "#7A6CB0", dark: "#564B80", light: "#ECE9F4" },
  { name: "Merah Bata", color: "#C0453B", dark: "#8E332C", light: "#F8E7E5" },
  { name: "Abu",        color: "#6B6B76", dark: "#46464E", light: "#F0F0F2" },
];

const UNIT_ICON_OPTIONS = ["fish", "water", "store", "signal", "cog", "chart", "building"];

function UnitManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = add mode
  const [fName, setFName] = useState("");
  const [fLeaderId, setFLeaderId] = useState("");
  const [fColorIdx, setFColorIdx] = useState(0);
  const [fIcon, setFIcon] = useState("fish");

  const allUnits = Object.values(UNITS);
  // Leaders available to assign
  const leaders = Object.values(USERS).filter(u => u.role === ROLES.LEADER);

  const openAdd = () => {
    setEditingId(null);
    setFName(""); setFLeaderId(""); setFColorIdx(0); setFIcon("fish");
    setShowForm(true);
  };

  const openEdit = (unit) => {
    setEditingId(unit.id);
    setFName(unit.name);
    setFLeaderId(unit.leaderId || "");
    const ci = UNIT_COLOR_OPTIONS.findIndex(c => c.color === unit.color);
    setFColorIdx(ci >= 0 ? ci : 0);
    setFIcon(unit.icon || "fish");
    setShowForm(true);
  };

  const handleSave = () => {
    if (!fName.trim()) { alert("Isi nama unit"); return; }
    const c = UNIT_COLOR_OPTIONS[fColorIdx];
    const leaderName = fLeaderId ? getUser(fLeaderId)?.name : "Tanpa Leader";
    alert(
      (editingId === null ? "Unit baru:" : "Perubahan unit:") + "\n\n" +
      `Nama: ${fName}\n` +
      `Leader: ${leaderName}\n` +
      `Warna: ${c.name}\n` +
      `Ikon: ${fIcon}\n\n` +
      "Catatan: perubahan STRUKTUR unit (tambah/edit unit induk) belum aktif di " +
      "prototype ini — unit adalah fondasi yang menyentuh banyak relasi, jadi " +
      "diaktifkan di Fase 2. Sub Unit, KPI, Project, dan Bobot sudah live."
    );
    setShowForm(false);
  };

  // Count dependents for delete-safety
  const dependents = (unitId) => {
    const subCount = LIVE.subUnits.filter(s => s.unitId === unitId).length;
    const kpiCount = LIVE.submissions.filter(s => {
      const sub = LIVE.subUnits.find(su => su.id === s.subUnitId);
      return sub && sub.unitId === unitId;
    }).length;
    const projCount = LIVE.projects.filter(p => p.unitId === unitId).length;
    return { subCount, kpiCount, projCount, total: subCount + kpiCount + projCount };
  };

  const handleDelete = (unit) => {
    const dep = dependents(unit.id);
    if (dep.total > 0) {
      alert(
        `Unit "${unit.name}" tidak bisa dihapus.\n\n` +
        `Masih ada: ${dep.subCount} sub unit, ${dep.kpiCount} KPI, ${dep.projCount} project.\n\n` +
        "Pindahkan atau hapus data tersebut dulu."
      );
      return;
    }
    if (confirm(`Hapus unit "${unit.name}"?\n\nUnit ini kosong (tanpa sub unit/KPI/project), jadi aman dihapus.`)) {
      alert(`Unit "${unit.name}" dihapus.`);
    }
  };

  return (
    <Card style={{ padding: 0 }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px",
        borderBottom: `1px solid ${COLORS.bgMuted}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Unit Manager</h3>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: COLORS.textMuted }}>
            Kelola unit bisnis: tambah, ganti nama, atur leader, warna & ikon
          </p>
        </div>
        <button
          onClick={openAdd}
          type="button"
          style={{
            padding: "8px 14px",
            background: COLORS.primary,
            color: COLORS.white,
            border: "none",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="plus" size={14} color={COLORS.white} />
          Tambah Unit
        </button>
      </div>

      {/* Inline add/edit form */}
      {showForm && (
        <div style={{
          padding: "16px 18px",
          background: COLORS.infoBg,
          borderBottom: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.primaryDark, marginBottom: 12 }}>
            {editingId === null ? "Unit Baru" : "Edit Unit"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Nama Unit <span style={{ color: COLORS.danger }}>*</span></label>
              <input
                type="text"
                value={fName}
                onChange={e => setFName(e.target.value)}
                placeholder="cth: Logistik"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Leader</label>
              <select value={fLeaderId} onChange={e => setFLeaderId(e.target.value)} style={inputStyle}>
                <option value="">— Tanpa Leader —</option>
                {leaders.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color picker */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Warna Unit</label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {UNIT_COLOR_OPTIONS.map((c, idx) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setFColorIdx(idx)}
                  title={c.name}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: c.color,
                    border: fColorIdx === idx ? `3px solid ${COLORS.dark}` : `2px solid ${COLORS.white}`,
                    boxShadow: `0 0 0 1px ${COLORS.border}`,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {fColorIdx === idx && <Icon name="check" size={15} color={COLORS.white} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Ikon Unit</label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {UNIT_ICON_OPTIONS.map(ic => {
                const active = fIcon === ic;
                const c = UNIT_COLOR_OPTIONS[fColorIdx];
                return (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setFIcon(ic)}
                    title={ic}
                    style={{
                      width: 38, height: 38, borderRadius: 9,
                      background: active ? c.light : COLORS.white,
                      border: active ? `2px solid ${c.color}` : `1px solid ${COLORS.border}`,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon name={ic} size={19} color={active ? c.color : COLORS.textMuted} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview chip */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Preview</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: UNIT_COLOR_OPTIONS[fColorIdx].light,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={fIcon} size={20} color={UNIT_COLOR_OPTIONS[fColorIdx].color} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.dark }}>{fName || "Nama Unit"}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>
                  {fLeaderId ? `Leader: ${getUser(fLeaderId)?.name}` : "Tanpa Leader"}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)} type="button" style={adminBtnStyle}>Batal</button>
            <button
              onClick={handleSave}
              type="button"
              style={{
                padding: "8px 18px",
                background: COLORS.primary,
                color: COLORS.white,
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {editingId === null ? "Simpan Unit" : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      )}

      {/* Unit list */}
      <div style={{ padding: "8px 0" }}>
        {allUnits.map((unit, i) => {
          const dep = dependents(unit.id);
          const leader = unit.leaderId ? getUser(unit.leaderId) : null;
          const locked = dep.total > 0;
          return (
            <div
              key={unit.id}
              style={{
                padding: "12px 18px",
                borderBottom: i === allUnits.length - 1 ? "none" : `1px solid ${COLORS.bgMuted}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: unit.colorLight,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon name={unit.icon} size={20} color={unit.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.dark }}>{unit.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                  {leader ? `Leader: ${leader.name}` : <em style={{ color: COLORS.warning }}>Tanpa Leader</em>}
                  {" • "}
                  {dep.subCount} sub unit • {dep.projCount} project
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                <button onClick={() => openEdit(unit)} type="button" style={adminBtnStyle}>Edit</button>
                {locked ? (
                  <button
                    type="button"
                    disabled
                    title={`Tidak bisa dihapus — masih ada ${dep.subCount} sub unit, ${dep.kpiCount} KPI, ${dep.projCount} project`}
                    style={{
                      ...adminBtnStyle,
                      color: COLORS.textLight,
                      background: COLORS.bgMuted,
                      cursor: "not-allowed",
                      display: "inline-flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <Icon name="lock" size={12} color={COLORS.textLight} />
                    Terkunci
                  </button>
                ) : (
                  <button onClick={() => handleDelete(unit)} type="button" style={adminBtnDanger}>Hapus</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        padding: "10px 14px",
        background: COLORS.warningBg,
        borderTop: `1px solid #EBD9B4`,
        fontSize: 10,
        color: "#8A6420",
      }}>
        Nama & leader unit bisa diganti kapan saja tanpa merusak data. Unit hanya bisa dihapus jika sudah kosong (tanpa sub unit, KPI, atau project).
      </div>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Admin: Sub Unit Manager (existing)
// ──────────────────────────────────────────────────────────────────────────

function SubUnitManager() {
  const store = useDataStore();
  const [selectedUnitId, setSelectedUnitId] = useState("aquaculture");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = add mode
  const [formName, setFormName] = useState("");
  const [formPicId, setFormPicId] = useState("");
  const [formParentId, setFormParentId] = useState("aquaculture");
  const selectedUnit = UNITS[selectedUnitId];

  const subUnits = useMemo(() =>
    getSubUnitsByUnit(selectedUnitId).map(su => ({
      ...su,
      pic: getUser(su.picId),
      snapshot: getSubUnitSnapshot(su.id),
    })),
    [selectedUnitId, store?.subUnits, store?.submissions]
  );

  // PIC candidates: users with PIC role
  const picCandidates = Object.values(USERS).filter(u => u.role === ROLES.PIC);

  const [busy, setBusy] = useState(false);

  // Count KPI submissions for a sub unit (for delete-safety)
  const kpiCountFor = (subUnitId) =>
    LIVE.submissions.filter(s => s.subUnitId === subUnitId).length;

  // Muat ulang sub-unit dari API ke store (sumber tampilan).
  const reloadSubUnits = async () => {
    const list = await fetchSubUnits();
    if (store) store.setSubUnits(list);
  };

  const slugify = (s) => (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const openAdd = () => {
    setEditingId(null);
    setFormName(""); setFormPicId(""); setFormParentId(selectedUnitId);
    setShowForm(true);
  };

  const openEdit = (su) => {
    setEditingId(su.id);
    setFormName(su.name);
    setFormPicId(su.picId || "");
    setFormParentId(su.unitId);
    setShowForm(true);
  };

  const handleDeleteSub = async (su) => {
    const kpiCount = kpiCountFor(su.id);
    if (kpiCount > 0) {
      alert(
        `Sub unit "${su.name}" tidak bisa dihapus.\n\n` +
        `Masih ada ${kpiCount} KPI terkait. Hapus atau pindahkan KPI tersebut dulu.`
      );
      return;
    }
    if (!confirm(`Hapus sub unit "${su.name}"?\n\nSub unit ini belum punya KPI, jadi aman dihapus.`)) return;
    try {
      await deleteSubUnit(su.id);
      await reloadSubUnits();
    } catch (e) {
      alert(e.message || "Gagal menghapus sub unit.");
    }
  };

  const handleAdd = async () => {
    if (busy) return;
    if (!formName.trim()) { alert("Isi nama sub unit"); return; }
    if (!formParentId)    { alert("Pilih parent unit"); return; }
    setBusy(true);
    try {
      if (editingId === null) {
        const id = `${formParentId}-${slugify(formName)}-${Date.now().toString(36).slice(-4)}`;
        await createSubUnit({
          id,
          unitId: formParentId,
          name: formName.trim(),
          picId: formPicId || null,
          icon: UNITS[formParentId]?.icon || "store",
          status: "active",
        });
      } else {
        // Ubah nama, PIC, dan parent unit.
        await updateSubUnit(editingId, {
          name: formName.trim(),
          picId: formPicId || null,
          unitId: formParentId,
        });
      }
      await reloadSubUnits();
      setFormName(""); setFormPicId(""); setEditingId(null); setShowForm(false);
    } catch (e) {
      alert(e.message || "Gagal menyimpan sub unit.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ padding: 0 }}>
      <div style={{
        padding: "14px 18px",
        borderBottom: `1px solid ${COLORS.bgMuted}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Sub Unit Manager</h3>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: COLORS.textMuted }}>
            Setiap unit punya beberapa sub unit, masing-masing punya PIC sendiri
          </p>
        </div>
        <button
          onClick={() => showForm ? setShowForm(false) : openAdd()}
          type="button"
          style={{
            padding: "8px 14px",
            background: showForm ? COLORS.white : COLORS.primary,
            color: showForm ? COLORS.text : COLORS.white,
            border: showForm ? `1px solid ${COLORS.border}` : "none",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {!showForm && <Icon name="plus" size={14} color={COLORS.white} />}
          {showForm ? "Tutup" : "Tambah Sub Unit"}
        </button>
      </div>

      {/* Inline add/edit form */}
      {showForm && (
        <div style={{
          padding: "16px 18px",
          background: COLORS.infoBg,
          borderBottom: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.primaryDark, marginBottom: 12 }}>
            {editingId === null ? "Sub Unit Baru" : "Edit Sub Unit"}
          </div>
          {(() => {
            const editingKpiCount = editingId ? kpiCountFor(editingId) : 0;
            const parentLocked = editingId !== null && editingKpiCount > 0;
            return (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>
                    Parent Unit <span style={{ color: COLORS.danger }}>*</span>
                  </label>
                  {parentLocked ? (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 12px",
                      background: COLORS.bgMuted,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8,
                    }}>
                      <Icon name="lock" size={14} color={COLORS.textMuted} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                        {UNITS[formParentId]?.name}
                      </span>
                      <span style={{ fontSize: 10, color: COLORS.warning, marginLeft: "auto" }}>
                        Tidak bisa dipindah — sudah punya {editingKpiCount} KPI
                      </span>
                    </div>
                  ) : (
                    <select value={formParentId} onChange={e => setFormParentId(e.target.value)} style={inputStyle}>
                      {Object.values(UNITS).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>Nama Sub Unit <span style={{ color: COLORS.danger }}>*</span></label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="cth: Kolam Cerelek 2, Outlet Bandung, Cabang Timur"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Assign PIC (opsional)</label>
                    <select value={formPicId} onChange={e => setFormPicId(e.target.value)} style={inputStyle}>
                      <option value="">— Belum di-assign —</option>
                      {picCandidates.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            );
          })()}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)} type="button" style={adminBtnStyle}>Batal</button>
            <button onClick={handleAdd} type="button" style={{ padding: "8px 18px", background: COLORS.primary, color: COLORS.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{editingId === null ? "Simpan Sub Unit" : "Simpan Perubahan"}</button>
          </div>
        </div>
      )}

      <div style={{
        padding: "12px 18px",
        background: COLORS.bgMuted,
        borderBottom: `1px solid ${COLORS.bgMuted}`,
      }}>
        <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>
          Pilih Unit:
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {Object.values(UNITS).map(unit => {
            const isActive = unit.id === selectedUnitId;
            const count = getSubUnitsByUnit(unit.id).length;
            return (
              <button
                key={unit.id}
                onClick={() => setSelectedUnitId(unit.id)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: `1px solid ${isActive ? unit.color : COLORS.border}`,
                  background: isActive ? unit.color : COLORS.white,
                  color: isActive ? COLORS.white : COLORS.text,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name={unit.icon} size={13} /> {unit.name} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "8px 0" }}>
        {subUnits.length === 0 && (
          <div style={{
            padding: "30px 20px",
            textAlign: "center",
            color: COLORS.textLight,
            fontSize: 12,
          }}>
            Belum ada sub unit untuk {selectedUnit.name}
          </div>
        )}
        {subUnits.map((su, i) => (
          <SubUnitManagerRow
            key={su.id}
            subUnit={su}
            parentUnit={selectedUnit}
            isLast={i === subUnits.length - 1}
            kpiCount={kpiCountFor(su.id)}
            onEdit={() => openEdit(su)}
            onDelete={() => handleDeleteSub(su)}
          />
        ))}
      </div>

      <div style={{
        padding: "10px 14px",
        background: COLORS.warningBg,
        borderTop: `1px solid #EBD9B4`,
        fontSize: 10,
        color: "#8A6420",
      }}>Saat sub unit baru dibuat, otomatis bisa di-assign ke PIC. PIC dapat akses login & workspace sendiri.
      </div>
    </Card>
  );
}

function SubUnitManagerRow({ subUnit, parentUnit, isLast, kpiCount = 0, onEdit, onDelete }) {
  const locked = kpiCount > 0;
  return (
    <div style={{
      padding: "12px 18px",
      borderBottom: isLast ? "none" : `1px solid ${COLORS.bgMuted}`,
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: parentUnit.colorLight,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}><Icon name={subUnit.icon} size={19} color={parentUnit.color} /></div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark }}>{subUnit.name}</span>
          <Pill color={COLORS.success} bg={COLORS.successBg}>{subUnit.status}</Pill>
          {kpiCount > 0 && <Pill color={COLORS.primary} bg={COLORS.infoBg}>{kpiCount} KPI</Pill>}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
          PIC: {subUnit.pic ? (
            <strong style={{ color: COLORS.text }}>{subUnit.pic.name} ({subUnit.pic.email})</strong>
          ) : (
            <em style={{ color: COLORS.danger }}>Belum di-assign</em>
          )}
          {" • "}
          Dibuat: {formatDate(subUnit.createdAt)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        <button onClick={onEdit} type="button" style={adminBtnStyle}>Edit</button>
        {locked ? (
          <button
            type="button"
            disabled
            title={`Tidak bisa dihapus — masih ada ${kpiCount} KPI`}
            style={{
              ...adminBtnStyle,
              color: COLORS.textLight,
              background: COLORS.bgMuted,
              cursor: "not-allowed",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}
          >
            <Icon name="lock" size={12} color={COLORS.textLight} />
            Terkunci
          </button>
        ) : (
          <button onClick={onDelete} type="button" style={adminBtnDanger}>Hapus</button>
        )}
      </div>
    </div>
  );
}

function UserManager() {
  const [users, setUsers] = useState(() => Object.values(USERS));
  const [filterRole, setFilterRole] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = mode tambah
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fRole, setFRole] = useState(ROLES.PIC);
  const [fUnitId, setFUnitId] = useState("");
  const [fSubUnitId, setFSubUnitId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const allUsers = users;
  const filtered = filterRole === "all" ? allUsers : allUsers.filter(u => u.role === filterRole);

  // Muat ulang dari API + perbarui binding modul USERS agar seluruh app ikut segar.
  const reload = async () => {
    const list = await fetchUsers();
    setUsersData(indexById(list));
    setUsers(list);
  };

  const resetForm = () => {
    setEditingId(null);
    setFName(""); setFEmail(""); setFPassword("");
    setFRole(ROLES.PIC); setFUnitId(""); setFSubUnitId(""); setError("");
  };
  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (u) => {
    setEditingId(u.id);
    setFName(u.name); setFEmail(u.email); setFPassword("");
    setFRole(u.role); setFUnitId(u.unitId || ""); setFSubUnitId(u.subUnitId || "");
    setError(""); setShowForm(true);
  };

  const slugify = (s) => (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const handleSave = async () => {
    setError("");
    if (!fName.trim()) return setError("Nama wajib diisi.");
    if (!fEmail.trim()) return setError("Email wajib diisi.");
    if (!editingId && !fPassword.trim()) return setError("Password wajib diisi untuk user baru.");
    if (fRole === ROLES.LEADER && !fUnitId) return setError("Leader harus punya unit.");
    if (fRole === ROLES.PIC && !fSubUnitId) return setError("PIC harus punya sub unit.");

    // unitId untuk PIC diturunkan dari sub-unit yang dipilih.
    const unitId = fRole === ROLES.LEADER
      ? fUnitId
      : (fRole === ROLES.PIC ? (LIVE.subUnits.find(s => s.id === fSubUnitId)?.unitId || null) : null);
    const subUnitId = fRole === ROLES.PIC ? fSubUnitId : null;

    setBusy(true);
    try {
      if (editingId) {
        const body = { name: fName.trim(), email: fEmail.trim(), role: fRole, unitId, subUnitId };
        if (fPassword.trim()) body.password = fPassword.trim();
        await updateUser(editingId, body);
      } else {
        const id = slugify(fEmail.split("@")[0]) || slugify(fName) || `user-${Date.now()}`;
        await createUser({ id, name: fName.trim(), email: fEmail.trim(), password: fPassword.trim(), role: fRole, unitId, subUnitId });
      }
      await reload();
      setShowForm(false); resetForm();
    } catch (e) {
      setError(e.message || "Gagal menyimpan user.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Hapus user "${u.name}"?\n\nTindakan ini permanen dan tidak bisa dibatalkan.`)) return;
    try {
      await deleteUser(u.id);
      await reload();
    } catch (e) {
      alert(e.message || "Gagal menghapus user.");
    }
  };

  const counts = {
    all: allUsers.length,
    [ROLES.OWNER]:   allUsers.filter(u => u.role === ROLES.OWNER).length,
    [ROLES.FINANCE]: allUsers.filter(u => u.role === ROLES.FINANCE).length,
    [ROLES.HR]:      allUsers.filter(u => u.role === ROLES.HR).length,
    [ROLES.LEADER]:  allUsers.filter(u => u.role === ROLES.LEADER).length,
    [ROLES.PIC]:     allUsers.filter(u => u.role === ROLES.PIC).length,
  };

  return (
    <Card style={{ padding: 0 }}>
      <div style={{
        padding: "14px 18px",
        borderBottom: `1px solid ${COLORS.bgMuted}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>User Manager</h3>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: COLORS.textMuted }}>
            Total {allUsers.length} user (termasuk {counts[ROLES.PIC]} PIC sub unit)
          </p>
        </div>
        <button
          onClick={() => { if (showForm) { setShowForm(false); resetForm(); } else { openCreate(); } }}
          type="button"
          style={{
            padding: "8px 14px",
            background: showForm ? COLORS.white : COLORS.primary,
            color: showForm ? COLORS.text : COLORS.white,
            border: showForm ? `1px solid ${COLORS.border}` : "none",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {!showForm && <Icon name="plus" size={14} color={COLORS.white} />}
          {showForm ? "Tutup" : "Tambah User"}
        </button>
      </div>

      {/* Inline add-user form */}
      {showForm && (
        <div style={{
          padding: "16px 18px",
          background: COLORS.infoBg,
          borderBottom: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.primaryDark, marginBottom: 12 }}>
            {editingId ? "Ubah User" : "User Baru"}
          </div>
          {error && (
            <div style={{ fontSize: 11, color: COLORS.danger, background: COLORS.dangerBg, padding: "8px 10px", borderRadius: 8, marginBottom: 12 }}>
              {error}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Nama <span style={{ color: COLORS.danger }}>*</span></label>
              <input type="text" value={fName} onChange={e => setFName(e.target.value)} placeholder="Nama lengkap" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email <span style={{ color: COLORS.danger }}>*</span></label>
              <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="email@gdn.co.id" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>
              Password {editingId
                ? <span style={{ color: COLORS.textLight, fontWeight: 400 }}>(kosongkan jika tidak diubah)</span>
                : <span style={{ color: COLORS.danger }}>*</span>}
            </label>
            <input
              type="password"
              value={fPassword}
              onChange={e => setFPassword(e.target.value)}
              placeholder={editingId ? "••••••" : "Password awal"}
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Role <span style={{ color: COLORS.danger }}>*</span></label>
              <select value={fRole} onChange={e => { setFRole(e.target.value); setFUnitId(""); setFSubUnitId(""); }} style={inputStyle}>
                <option value={ROLES.OWNER}>Owner</option>
                <option value={ROLES.FINANCE}>Finance</option>
                <option value={ROLES.HR}>HR</option>
                <option value={ROLES.LEADER}>Leader Unit</option>
                <option value={ROLES.PIC}>PIC Sub Unit</option>
              </select>
            </div>
            {fRole === ROLES.LEADER && (
              <div>
                <label style={labelStyle}>Unit <span style={{ color: COLORS.danger }}>*</span></label>
                <select value={fUnitId} onChange={e => setFUnitId(e.target.value)} style={inputStyle}>
                  <option value="">— Pilih Unit —</option>
                  {Object.values(UNITS).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
            {fRole === ROLES.PIC && (
              <div>
                <label style={labelStyle}>Sub Unit <span style={{ color: COLORS.danger }}>*</span></label>
                <select value={fSubUnitId} onChange={e => setFSubUnitId(e.target.value)} style={inputStyle}>
                  <option value="">— Pilih Sub Unit —</option>
                  {LIVE.subUnits.map(s => <option key={s.id} value={s.id}>{UNITS[s.unitId].name} / {s.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => { setShowForm(false); resetForm(); }} type="button" style={adminBtnStyle}>Batal</button>
            <button
              onClick={handleSave}
              type="button"
              disabled={busy}
              style={{ padding: "8px 18px", background: COLORS.primary, color: COLORS.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1, fontFamily: "inherit" }}
            >
              {busy ? "Menyimpan…" : (editingId ? "Simpan Perubahan" : "Simpan User")}
            </button>
          </div>
        </div>
      )}

      <div style={{
        padding: "10px 18px",
        background: "#FAFBFC",
        borderBottom: `1px solid ${COLORS.bgMuted}`,
        display: "flex",
        gap: 5,
        flexWrap: "wrap",
      }}>
        {[
          ["all", "Semua", counts.all],
          [ROLES.OWNER, "Owner", counts[ROLES.OWNER]],
          [ROLES.FINANCE, "Finance", counts[ROLES.FINANCE]],
          [ROLES.HR, "HR", counts[ROLES.HR]],
          [ROLES.LEADER, "Leader", counts[ROLES.LEADER]],
          [ROLES.PIC, "PIC", counts[ROLES.PIC]],
        ].map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setFilterRole(key)}
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              border: `1px solid ${filterRole === key ? COLORS.dark : COLORS.border}`,
              background: filterRole === key ? COLORS.dark : COLORS.white,
              color: filterRole === key ? COLORS.white : COLORS.text,
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["Nama", "Email", "Role", "Unit / Sub Unit", "Aksi"].map(h => (
                <th key={h} style={{
                  padding: "9px 12px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: COLORS.textMuted,
                  textAlign: "left",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <UserManagerRow key={u.id} user={u} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        padding: "10px 14px",
        background: "#FFFBEB",
        borderTop: `1px solid #FDE68A`,
        fontSize: 10,
        color: "#92400E",
      }}>PIC sub unit punya akun login sendiri, terpisah dari Leader. Mereka hanya lihat sub unit yang ditugaskan.
      </div>
    </Card>
  );
}

function UserManagerRow({ user, onEdit, onDelete }) {
  const unit = user.unitId ? UNITS[user.unitId] : null;
  const subUnit = user.subUnitId ? LIVE.subUnits.find(su => su.id === user.subUnitId) : null;

  let location = "—";
  if (subUnit && unit) location = `${unit.name} / ${subUnit.name}`;
  else if (unit) location = `${unit.name}`;
  else if ([ROLES.OWNER, ROLES.FINANCE, ROLES.HR].includes(user.role)) location = "Semua Unit";

  return (
    <tr style={{ borderTop: `1px solid ${COLORS.bgMuted}` }}>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 99,
            background: COLORS.bgMuted, color: COLORS.text,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, flexShrink: 0,
          }}>{user.name.charAt(0)}</span>
          <span style={{ fontWeight: 700, color: COLORS.dark }}>{user.name}</span>
        </div>
      </td>
      <td style={{ padding: "10px 12px", color: COLORS.textMuted }}>{user.email}</td>
      <td style={{ padding: "10px 12px" }}>
        <Pill color={COLORS.text} bg={COLORS.bgMuted}>{ROLE_LABELS[user.role]}</Pill>
      </td>
      <td style={{ padding: "10px 12px", color: COLORS.textMuted, fontSize: 11 }}>{location}</td>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onEdit(user)} style={adminBtnStyle}>Edit</button>
          <button onClick={() => onDelete(user)} style={adminBtnDanger}>Hapus</button>
        </div>
      </td>
    </tr>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// §10 LEADER PAGES
// ════════════════════════════════════════════════════════════════════════════

function LeaderWorkspace({ user, onSubmitNew, onSelectSubmission }) {
  const store = useDataStore(); // subscribe to live in-session data so this page re-renders on changes
  const unit = UNITS[user.unitId];

  const subUnits = useMemo(() =>
    getSubUnitsByUnit(user.unitId).map(su => ({
      ...su,
      pic: getUser(su.picId),
      snapshot: getSubUnitSnapshot(su.id),
    })),
    [user.unitId, store?.subUnits, store?.submissions, store?.subUnitWeights]
  );

  // KPI submissions in this unit needing attention
  const unitSubmissions = useMemo(() =>
    getSubmissions({ unitId: user.unitId }).sort((a, b) => {
      const order = { estimated: 0, approved: 1, closed: 2 };
      return order[a.status] - order[b.status];
    }),
    [user.unitId, store?.submissions]
  );

  const unitScore = calculateUnitScore(user.unitId);
  const status = getScoreStatus(unitScore);

  const subUnitsWithoutPic = subUnits.filter(su => !su.picId);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 14px" }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: COLORS.dark, margin: 0 }}>
          Halo {user.name}
        </h1>
        <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "3px 0 0" }}>
          Leader {unit.name} • {APP_CONFIG.period}
        </p>
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${unit.color}, ${unit.colorDark})`,
        padding: "18px 22px",
        borderRadius: 14,
        marginBottom: 18,
        color: COLORS.white,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 1 }}>
            Pencapaian Unit
          </div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>
            {unitScore}% <span style={{ fontSize: 13, fontWeight: 600 }}>· {status.label}</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
            {subUnits.length} sub unit
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,0.12)" }}><Icon name={unit.icon} size={32} color={COLORS.white} /></div>
      </div>

      {/* Action bar: Leader can submit KPI on behalf of a sub-unit */}
      <Card style={{ padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.dark }}>Ajukan KPI</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
              Anda bisa ajukan KPI mewakili sub unit (terutama yang belum punya PIC)
            </div>
          </div>
          <Button variant="primary" onClick={() => {
            // Leader picks a sub-unit; default to first one
            const target = subUnits[0];
            if (target && onSubmitNew) onSubmitNew(target.id);
          }}>Ajukan KPI Baru
          </Button>
        </div>
        {subUnitsWithoutPic.length > 0 && (
          <div style={{
            marginTop: 10,
            padding: "8px 11px",
            background: COLORS.warningBg,
            borderRadius: 7,
            fontSize: 11,
            color: "#92400E",
          }}>{subUnitsWithoutPic.length} sub unit belum punya PIC: {subUnitsWithoutPic.map(su => su.name).join(", ")}. Anda perlu input KPI-nya sendiri.
          </div>
        )}
      </Card>

      <SectionHeader title="Sub Unit Anda" subtitle="Klik untuk lihat detail tiap sub unit" />

      <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        {subUnits.map(su => (
          <LeaderSubUnitCard
            key={su.id}
            subUnit={su}
            parentUnit={unit}
            onSubmitNew={onSubmitNew}
          />
        ))}
      </div>

      {/* KPI submissions in unit */}
      {unitSubmissions.length > 0 && (
        <div>
          <SectionHeader title="KPI di Unit Anda" subtitle="Status semua submission sub unit" />
          <div style={{ display: "grid", gap: 8 }}>
            {unitSubmissions.map(sub => (
              <SubmissionRow key={sub.id} submission={sub} onView={onSelectSubmission} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LeaderSubUnitCard({ subUnit, parentUnit, onSubmitNew }) {
  const snapshot = subUnit.snapshot;
  const score = snapshot?.score || 0;
  const status = getScoreStatus(score);

  return (
    <Card hover style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11,
          background: parentUnit.colorLight,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}><Icon name={subUnit.icon} size={22} color={parentUnit.color} /></div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.dark }}>{subUnit.name}</span>
            <Pill color={status.color} bg={status.bg}>{status.label}</Pill>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>
            PIC: {subUnit.pic ? <strong>{subUnit.pic.name}</strong> : <em>Belum ditugaskan</em>}
          </div>
          <ProgressBar value={score} color={status.color} height={6} />
        </div>

        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div>
            <div style={{ fontSize: 9, color: COLORS.textLight, fontWeight: 700, textTransform: "uppercase" }}>Skor</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: status.color }}>{score}%</div>
          </div>
          {!subUnit.picId && onSubmitNew && (
            <Button variant="secondary" size="sm" onClick={() => onSubmitNew(subUnit.id)}>
              + KPI
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// Shared: Input Margin Harian (untuk KPI bulanan)
// Tahap 1: input (tabel sebulan + mode cepat) + total otomatis
// ════════════════════════════════════════════════════════════════════════════

const MONTH_NAMES_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

// Derive year & month index from a submission period label like "Mei 2026"
function parsePeriodLabel(label) {
  if (!label) return { year: 2026, monthIdx: 4 };
  const parts = label.trim().split(/\s+/);
  const monthIdx = MONTH_NAMES_ID.findIndex(m => m.toLowerCase() === (parts[0] || "").toLowerCase());
  const year = parseInt(parts[1], 10) || 2026;
  return { year, monthIdx: monthIdx >= 0 ? monthIdx : 4 };
}

function daysInMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0).getDate();
}

/**
 * DailyMarginPanel — full-screen modal to record daily margin for a monthly KPI.
 * Total of all days auto-becomes the month's realized margin.
 * Two input modes: full month table + quick single-day entry.
 */
function DailyMarginPanel({ submission, subUnitName, periodLabel, onClose }) {
  const { year, monthIdx } = parsePeriodLabel(periodLabel || submission?.period);
  const totalDays = daysInMonth(year, monthIdx);

  // daily values: { [day:number]: number }  (day = 1..totalDays)
  const [daily, setDaily] = useState({});
  const [mode, setMode] = useState("table"); // "table" | "quick"

  // Quick-mode state
  const [quickDay, setQuickDay] = useState(1);
  const [quickValue, setQuickValue] = useState("");

  const setDay = (day, value) => {
    setDaily(prev => ({ ...prev, [day]: value }));
  };

  const saveQuick = () => {
    if (quickValue === "" || isNaN(Number(quickValue))) { alert("Isi nilai margin (angka). Kalau tidak ada, isi 0."); return; }
    setDaily(prev => ({ ...prev, [quickDay]: Number(quickValue) }));
    alert(`Margin tgl ${quickDay} ${MONTH_NAMES_ID[monthIdx]} ${year}: ${formatRupiahFull(Number(quickValue))} tersimpan.`);
    setQuickValue("");
    if (quickDay < totalDays) setQuickDay(quickDay + 1);
  };

  // Totals
  const filledDays = Object.keys(daily).filter(d => daily[d] !== "" && daily[d] !== undefined).length;
  const totalMargin = Object.values(daily).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const avgPerDay = filledDays > 0 ? totalMargin / filledDays : 0;
  const targetMargin = submission?.targetMargin || 0;
  const pctOfTarget = targetMargin > 0 ? Math.round((totalMargin / targetMargin) * 100) : null;

  const handleSaveAll = () => {
    alert(
      "Margin harian disimpan.\n\n" +
      `Sub Unit: ${subUnitName}\n` +
      `Periode: ${MONTH_NAMES_ID[monthIdx]} ${year}\n` +
      `Hari terisi: ${filledDays} dari ${totalDays}\n` +
      `Total margin bulan: ${formatRupiahFull(totalMargin)}\n` +
      (pctOfTarget !== null ? `Capaian vs target: ${pctOfTarget}%\n` : "") +
      "\nTotal ini otomatis menjadi realisasi margin bulan tersebut.\n" +
      "(Level A: berlaku selama sesi ini.)"
    );
    onClose();
  };

  const weekdayLabels = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(20,20,26,0.55)", zIndex: 1000,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "24px 16px", overflowY: "auto",
    }}>
      <div style={{
        background: COLORS.white, borderRadius: 14, width: "100%", maxWidth: 760,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          background: `linear-gradient(135deg, ${COLORS.dark}, ${COLORS.darker})`,
          color: COLORS.white,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="calendar" size={20} color={COLORS.gold} />
            <div>
              <div style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700 }}>Input Margin Harian</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                {subUnitName} • {MONTH_NAMES_ID[monthIdx]} {year}
              </div>
            </div>
          </div>
          <button onClick={onClose} type="button" style={{
            width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="x" size={16} color={COLORS.white} />
          </button>
        </div>

        {/* Summary bar */}
        <div style={{
          padding: "12px 20px",
          background: COLORS.bgMuted,
          borderBottom: `1px solid ${COLORS.border}`,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Margin Bulan</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: totalMargin >= 0 ? COLORS.primary : COLORS.danger }}>
              {formatRupiahFull(totalMargin)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Hari Terisi</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.dark }}>{filledDays} / {totalDays}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {pctOfTarget !== null ? "Capaian vs Target" : "Rata-rata/Hari"}
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.dark }}>
              {pctOfTarget !== null ? `${pctOfTarget}%` : formatRupiah(avgPerDay)}
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ padding: "14px 20px 0", display: "flex", gap: 0, alignItems: "center" }}>
          <div style={{ display: "flex", border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
            <button type="button" onClick={() => setMode("table")} style={{
              padding: "6px 14px", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: mode === "table" ? COLORS.primary : COLORS.white,
              color: mode === "table" ? COLORS.white : COLORS.textMuted,
            }}>Tabel Sebulan</button>
            <button type="button" onClick={() => setMode("quick")} style={{
              padding: "6px 14px", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: mode === "quick" ? COLORS.primary : COLORS.white,
              color: mode === "quick" ? COLORS.white : COLORS.textMuted,
            }}>Input Cepat</button>
          </div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginLeft: 12 }}>
            Hari tanpa margin isi 0. Total otomatis jadi realisasi bulan.
          </div>
        </div>

        <div style={{ padding: "14px 20px", maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
          {mode === "quick" ? (
            <div style={{
              padding: "16px",
              background: COLORS.infoBg,
              border: `1px solid #C5DBF0`,
              borderRadius: 10,
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, marginBottom: 12, alignItems: "end" }}>
                <div>
                  <label style={labelStyle}>Tanggal</label>
                  <select value={quickDay} onChange={e => setQuickDay(Number(e.target.value))} style={inputStyle}>
                    {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d} {MONTH_NAMES_ID[monthIdx].slice(0,3)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Margin Hari Itu (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={quickValue === "" ? "" : Number(quickValue).toLocaleString("id-ID")}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d-]/g, "");
                      setQuickValue(raw === "" || raw === "-" ? raw : Number(raw));
                    }}
                    placeholder="cth: 2.500.000 (atau 0)"
                    style={inputStyle}
                  />
                </div>
              </div>
              <button onClick={saveQuick} type="button" style={{
                padding: "9px 18px", background: COLORS.primary, color: COLORS.white, border: "none",
                borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <Icon name="save" size={14} color={COLORS.white} /> Simpan & Lanjut Hari Berikutnya
              </button>
              {filledDays > 0 && (
                <div style={{ marginTop: 14, fontSize: 11, color: COLORS.textMuted }}>
                  Sudah terisi: {Object.keys(daily).filter(d => daily[d] !== "" && daily[d] !== undefined).sort((a,b)=>a-b).map(d => `tgl ${d}`).join(", ")}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
            }}>
              {weekdayLabels.map(w => (
                <div key={w} style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textAlign: "center", textTransform: "uppercase" }}>{w}</div>
              ))}
              {/* leading blanks to align first day to weekday */}
              {Array.from({ length: new Date(year, monthIdx, 1).getDay() }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
                const val = daily[day];
                const filled = val !== "" && val !== undefined;
                return (
                  <div key={day} style={{
                    border: `1px solid ${filled ? COLORS.primary : COLORS.border}`,
                    borderRadius: 8,
                    padding: "5px 5px 6px",
                    background: filled ? COLORS.infoBg : COLORS.white,
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, marginBottom: 3 }}>{day}</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={val === "" || val === undefined ? "" : Number(val).toLocaleString("id-ID")}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^\d-]/g, "");
                        setDay(day, raw === "" || raw === "-" ? raw : Number(raw));
                      }}
                      placeholder="0"
                      style={{
                        width: "100%", boxSizing: "border-box",
                        padding: "4px 5px", fontSize: 11,
                        border: `1px solid ${COLORS.border}`, borderRadius: 5,
                        fontFamily: "inherit", textAlign: "right",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 20px", borderTop: `1px solid ${COLORS.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.bg,
        }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>
            Total bulan: <strong style={{ color: COLORS.dark }}>{formatRupiahFull(totalMargin)}</strong> dari {filledDays} hari terisi
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} type="button" style={adminBtnStyle}>Batal</button>
            <button onClick={handleSaveAll} type="button" style={{
              padding: "9px 22px", background: COLORS.primary, color: COLORS.white, border: "none",
              borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: 7,
            }}>
              <Icon name="save" size={15} color={COLORS.white} style={{ pointerEvents: "none" }} />
              Simpan Margin Bulan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// §11 PIC PAGES
// ════════════════════════════════════════════════════════════════════════════

function PICWorkspace({ user, onSubmitNew, onCloseKPI, onUpdateMonthly, onSelectSubmission }) {
  const store = useDataStore(); // subscribe to live in-session data so this page re-renders on changes
  const subUnit = LIVE.subUnits.find(su => su.id === user.subUnitId);
  const parentUnit = subUnit ? UNITS[subUnit.unitId] : null;
  const snapshot = subUnit ? getSubUnitSnapshot(subUnit.id) : null;
  const leader = parentUnit ? getUser(parentUnit.leaderId) : null;
  const score = snapshot?.score || 0;
  const status = getScoreStatus(score);

  // Daily-margin panel (for monthly KPI)
  const [dailyMarginSub, setDailyMarginSub] = useState(null);

  // Get this PIC's submissions
  const mySubmissions = useMemo(() => {
    if (!subUnit) return [];
    return getSubmissions({ subUnitId: subUnit.id }).sort((a, b) => {
      // Pending first, then ongoing, then closed
      const order = { estimated: 0, approved: 1, closed: 2 };
      return order[a.status] - order[b.status];
    });
  }, [subUnit, store?.submissions]);

  if (!subUnit || !parentUnit) {
    return (
      <div style={{
        maxWidth: 700,
        margin: "40px auto",
        padding: 20,
        textAlign: "center",
        color: COLORS.textMuted,
      }}>
        Anda belum di-assign ke sub unit manapun. Hubungi Owner untuk setup.
      </div>
    );
  }

  // Categorize submissions
  const pendingApproval = mySubmissions.filter(s => s.status === "estimated");
  const inProgress = mySubmissions.filter(s => s.status === "approved");
  const completed = mySubmissions.filter(s => s.status === "closed");

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 14px" }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: COLORS.dark, margin: 0 }}>
          Halo {user.name}
        </h1>
        <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "3px 0 0" }}>
          PIC {subUnit.name} • {APP_CONFIG.period}
        </p>
      </div>

      {/* Sub unit banner */}
      <div style={{
        background: `linear-gradient(135deg, ${parentUnit.color}, ${parentUnit.colorDark})`,
        padding: "20px 22px",
        borderRadius: 14,
        marginBottom: 16,
        color: COLORS.white,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 50, height: 50, borderRadius: 13, background: "rgba(255,255,255,0.12)" }}><Icon name={subUnit.icon} size={28} color={COLORS.white} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>
              Sub Unit Anda
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{subUnit.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>
              Bagian dari {parentUnit.name}
              {leader && ` • Leader: ${leader.name}`}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>Skor Terakhir</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{score > 0 ? `${score}%` : "—"}</div>
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: 14,
          fontSize: 11,
          color: "rgba(255,255,255,0.85)",
          flexWrap: "wrap",
        }}>
          <span>Sub unit aktif sejak: {formatDate(subUnit.createdAt)}</span>
          {snapshot && <span>Bobot: {snapshot.weight}%</span>}
          <span>Status: {status.label}</span>
        </div>
      </div>

      {/* Action bar */}
      <Card style={{ padding: "12px 16px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.dark }}>KPI Anda</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
              {pendingApproval.length} menunggu approval • {inProgress.length} berjalan • {completed.length} selesai
            </div>
          </div>
          <Button variant="primary" onClick={() => onSubmitNew && onSubmitNew()}>Ajukan KPI Baru
          </Button>
        </div>
      </Card>

      {/* Pending approval */}
      {pendingApproval.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionHeader title="Menunggu Approval Owner" />
          <div style={{ display: "grid", gap: 8 }}>
            {pendingApproval.map(sub => (
              <SubmissionRow key={sub.id} submission={sub} onView={onSelectSubmission} />
            ))}
          </div>
        </div>
      )}

      {/* In progress */}
      {inProgress.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionHeader title="Sedang Berjalan" subtitle="Klik 'Tutup KPI' saat siklus/event selesai" />
          <div style={{ display: "grid", gap: 8 }}>
            {inProgress.map(sub => {
              const template = getFormTemplate(sub.templateId);
              const isMonthly = template?.frequency === "monthly";
              return (
                <SubmissionRow
                  key={sub.id}
                  submission={sub}
                  canClose={!isMonthly}
                  canUpdate={isMonthly}
                  onClose={onCloseKPI}
                  onUpdate={onUpdateMonthly}
                  onView={onSelectSubmission}
                  onDailyMargin={isMonthly ? () => setDailyMarginSub(sub) : undefined}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionHeader title="Selesai" subtitle="KPI yang sudah closing" />
          <div style={{ display: "grid", gap: 8 }}>
            {completed.map(sub => (
              <SubmissionRow key={sub.id} submission={sub} onView={onSelectSubmission} />
            ))}
          </div>
        </div>
      )}

      {mySubmissions.length === 0 && (
        <Card style={{ padding: 30, textAlign: "center", color: COLORS.textMuted, fontSize: 12 }}>
          Belum ada KPI yang diajukan. Klik "Ajukan KPI Baru" untuk mulai.
        </Card>
      )}

      {dailyMarginSub && (
        <DailyMarginPanel
          submission={dailyMarginSub}
          subUnitName={subUnit.name}
          periodLabel={dailyMarginSub.period}
          onClose={() => setDailyMarginSub(null)}
        />
      )}
    </div>
  );
}

/**
 * Compact row showing one KPI submission.
 */
function SubmissionRow({ submission, canClose, canUpdate, onClose, onUpdate, onView, onDailyMargin }) {
  const template = getFormTemplate(submission.templateId);
  const STATUS_INFO = {
    estimated: { label: "Menunggu Approval", color: COLORS.warning, bg: COLORS.warningBg, icon: "clock" },
    approved:  { label: "Aktif",             color: COLORS.success, bg: COLORS.successBg, icon: "play" },
    closed:    { label: "Selesai",           color: COLORS.primary, bg: COLORS.infoBg,    icon: "checkCircle" },
  };
  const info = STATUS_INFO[submission.status];

  return (
    <Card style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: info.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}><Icon name={info.icon} size={20} color={info.color} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark }}>
              {template?.name || "—"}
            </span>
            <Pill color={info.color} bg={info.bg}>{info.label}</Pill>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>
            {submission.period}
            {submission.approvedAt && <> • Approved: {formatDate(submission.approvedAt)}</>}
            {submission.closedAt && <> • Closed: {formatDate(submission.closedAt)}</>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {onDailyMargin && (
            <button
              onClick={onDailyMargin}
              type="button"
              title="Input margin harian"
              style={{ padding: "5px 12px", background: COLORS.secondary, color: COLORS.white, border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              <Icon name="calendar" size={12} color={COLORS.white} style={{ pointerEvents: "none" }} /> Margin Harian
            </button>
          )}
          {canClose && (
            <button
              onClick={() => onClose && onClose(submission.id)}
              type="button"
              style={{ padding: "5px 12px", background: COLORS.primary, color: COLORS.white, border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >Tutup KPI</button>
          )}
          {canUpdate && (
            <button
              onClick={() => onUpdate && onUpdate(submission.id)}
              type="button"
              style={{ padding: "5px 12px", background: COLORS.primary, color: COLORS.white, border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >Update</button>
          )}
          <button
            onClick={() => onView && onView(submission.id)}
            type="button"
            title="Lihat detail"
            style={{ padding: "5px 10px", background: COLORS.white, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <Icon name="eye" size={13} color={COLORS.textMuted} /> Lihat
          </button>
        </div>
      </div>
    </Card>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// DATA STORE (Tahap 1) — central in-session store
// ────────────────────────────────────────────────────────────────────────────
// Holds live copies of mutable data so edits made in one menu are visible across
// ALL menus within the same session (Level A — resets on browser refresh).
//
// The module-level constants (KPI_SUBMISSIONS, SUB_UNITS, MOCK_MILESTONES,
// MOCK_EXPENSES) are used only as INITIAL values here. Once components read from
// this store (Tahap 2) and forms write to it (Tahap 3), the store becomes the
// single live source of truth for the running session.
//
// NOTE (Tahap 1): the store exists but components still read the constants, so
// the UI is unchanged. This step only sets up the container.
// ════════════════════════════════════════════════════════════════════════════

const DataStoreContext = createContext(null);

/**
 * Access the in-session data store. Returns null if used outside the provider
 * (callers should fall back to module constants in that case).
 */
function useDataStore() {
  return useContext(DataStoreContext);
}

function DataStoreProvider({ children }) {
  const [submissions, setSubmissions] = useState(() => LIVE.submissions.map(s => ({ ...s })));
  const [subUnits, setSubUnits] = useState(() => LIVE.subUnits.map(s => ({ ...s })));
  const [milestones, setMilestones] = useState(() => ({ ...LIVE.milestones }));
  const [expenses, setExpenses] = useState(() => ({ ...LIVE.expenses }));
  const [projects, setProjects] = useState(() => LIVE.projects.map(p => ({ ...p })));
  const [templates, setTemplates] = useState(() => LIVE.templates.map(t => ({ ...t })));
  // Sub-unit weight overrides keyed by subUnitId (set via Unit page)
  const [subUnitWeights, setSubUnitWeights] = useState({});

  // Keep the LIVE module binding in sync so non-React helpers read current data.
  // Done during render (synchronously) so helpers called in the same render see it.
  syncLive({ submissions, subUnits, milestones, expenses, projects, templates, subUnitWeights });

  const value = useMemo(() => ({
    submissions, setSubmissions,
    subUnits, setSubUnits,
    milestones, setMilestones,
    expenses, setExpenses,
    projects, setProjects,
    templates, setTemplates,
    subUnitWeights, setSubUnitWeights,
  }), [submissions, subUnits, milestones, expenses, projects, templates, subUnitWeights]);

  return (
    <DataStoreContext.Provider value={value}>
      {children}
    </DataStoreContext.Provider>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// §12 APP ROUTER / MAIN
// ════════════════════════════════════════════════════════════════════════════

function AppInner() {
  const store = useDataStore();
  const [activeUserId, setActiveUserId] = useState(null);
  const [page, setPage] = useState(null);
  const [restoring, setRestoring] = useState(true); // sedang memulihkan sesi saat reload

  // Detail page context (which entity we're viewing)
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);

  // Form context (what action we're doing)
  // formMode: "submit_new" | "close_kpi" | "update_monthly" | "add_expense"
  const [formMode, setFormMode] = useState(null);
  const [formContext, setFormContext] = useState(null);

  // Load brand fonts (Plus Jakarta Sans for body, Bricolage Grotesque for headings)
  useEffect(() => {
    const id = "bizmonitor-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&display=swap";
    document.head.appendChild(link);
  }, []);

  // Arahkan halaman awal sesuai peran setelah login berhasil.
  const routeForRole = (role) => {
    if ([ROLES.OWNER, ROLES.FINANCE, ROLES.HR].includes(role)) return "dashboard";
    return "workspace";
  };

  // Bootstrap: muat seluruh data inti dari API ke binding LIVE/UNITS/USERS.
  // Setelah ini selesai, seluruh aplikasi membaca data asli secara konsisten.
  // (milestones & expenses sementara tetap dari seed — tabelnya belum dibuat.)
  const loadAllData = async () => {
    const { units, users, subUnits, projects, templates, submissions } = await fetchAllCoreData();
    setUnitsData(indexById(units));
    setUsersData(indexById(users));
    store.setSubUnits(subUnits);
    store.setProjects(projects);
    store.setTemplates(templates);
    store.setSubmissions(submissions);
  };

  // Login sungguhan: kirim email+password ke API, lalu muat data sebelum masuk.
  // Melempar error bila gagal (ditangkap & ditampilkan oleh LoginScreen).
  const handleLogin = async (email, password) => {
    const user = await apiLogin(email, password);
    await loadAllData();
    setActiveUserId(user.id);
    setPage(routeForRole(user.role));
  };

  // Pulihkan sesi saat halaman dimuat ulang jika token masih tersimpan & valid.
  useEffect(() => {
    if (!getToken()) { setRestoring(false); return; }
    fetchMe()
      .then(async (user) => {
        await loadAllData();
        setActiveUserId(user.id);
        setPage((p) => p || routeForRole(user.role));
      })
      .catch(() => {
        apiLogout();
        setActiveUserId(null);
        setPage(null);
      })
      .finally(() => setRestoring(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    apiLogout();
    setActiveUserId(null);
    setPage(null);
    setSelectedUnitId(null);
    setSelectedProjectId(null);
    setSelectedSubmissionId(null);
    setFormMode(null);
    setFormContext(null);
  };

  // Navigation helpers
  const goToPage = (newPage) => {
    setPage(newPage);
    setFormMode(null);
    setFormContext(null);
  };

  const goToUnitDetail = (unitId) => {
    setSelectedUnitId(unitId);
    setPage("unit_detail");
  };

  const goToProjectDetail = (projectId) => {
    setSelectedProjectId(projectId);
    setPage("project_detail");
  };

  const goToSubmissionDetail = (submissionId) => {
    setSelectedSubmissionId(submissionId);
    setPage("submission_detail");
  };

  const openForm = (mode, context) => {
    setFormMode(mode);
    setFormContext(context);
    setPage("form");
  };

  const closeForm = () => {
    setFormMode(null);
    setFormContext(null);
    // Return to where user came from
    setPage(formContext?.returnTo || "workspace");
  };

  // Saat memulihkan sesi (reload dengan token tersimpan): tampilkan layar muat.
  if (restoring && !activeUserId) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(135deg, ${COLORS.dark}, #1E1B4B)`, color: COLORS.white,
        fontFamily: FONTS.body, fontSize: 14, gap: 10, flexDirection: "column",
      }}>
        <img src={GDN_LOGO} alt="GDN" style={{ height: 48, opacity: 0.9 }} />
        <div>Memuat data…</div>
      </div>
    );
  }

  if (!activeUserId) {
    return <LoginScreen onAuthenticate={handleLogin} />;
  }

  const user = USERS[activeUserId];

  const renderContent = () => {
    // ─── Form pages ─────────────────────────────────────────────────────
    if (page === "form") {
      if (formMode === "submit_new") {
        return <SubmitKPIForm user={user} context={formContext} onBack={closeForm} />;
      }
      if (formMode === "close_kpi") {
        return <CloseKPIForm user={user} context={formContext} onBack={closeForm} />;
      }
      if (formMode === "update_monthly") {
        return <UpdateMonthlyKPIForm user={user} context={formContext} onBack={closeForm} />;
      }
      if (formMode === "add_expense") {
        return <AddExpenseForm user={user} context={formContext} onBack={closeForm} />;
      }
      if (formMode === "submit_project") {
        return <SubmitProjectForm user={user} context={formContext} onBack={closeForm} />;
      }
    }

    // ─── Detail pages ───────────────────────────────────────────────────
    if (page === "project_detail" && selectedProjectId) {
      return <ProjectDetailPage
        user={user}
        projectId={selectedProjectId}
        onBack={() => goToPage("projects")}
        onAddExpense={(projectId, milestoneId) => openForm("add_expense", { projectId, milestoneId, returnTo: "project_detail" })}
      />;
    }
    if (page === "submission_detail" && selectedSubmissionId) {
      return <SubmissionDetailPage
        user={user}
        submissionId={selectedSubmissionId}
        onBack={() => goToPage("kpi")}
        onClose={(submissionId) => openForm("close_kpi", { submissionId, returnTo: "submission_detail" })}
        onUpdate={(submissionId) => openForm("update_monthly", { submissionId, returnTo: "submission_detail" })}
      />;
    }

    // ─── Shared list pages ──────────────────────────────────────────────
    if (page === "projects") {
      return <ProjectListPage user={user} onSelectProject={goToProjectDetail} onNewProject={() => openForm("submit_project", null)} />;
    }
    if (page === "margin") {
      return <MarginDetailPage user={user} />;
    }
    if (page === "kpi") {
      return <KPIHistoryPage user={user} onSelectSubmission={goToSubmissionDetail} />;
    }
    if (page === "inbox") {
      return <InboxPage
        user={user}
        onSubmitNew={(subUnitId) => openForm("submit_new", { subUnitId, returnTo: "inbox" })}
        onCloseKPI={(submissionId) => openForm("close_kpi", { submissionId, returnTo: "inbox" })}
        onViewDetail={goToSubmissionDetail}
      />;
    }
    if (page === "audit") {
      return <AuditLogPage user={user} />;
    }

    // ─── Owner / Finance / HR ───────────────────────────────────────────
    if ([ROLES.OWNER, ROLES.FINANCE, ROLES.HR].includes(user.role)) {
      if (page === "admin" && user.role === ROLES.OWNER) return <AdminPanel />;
      if (page === "unit_detail" && selectedUnitId) {
        return <UnitDetailPage unitId={selectedUnitId} onBack={() => goToPage("dashboard")} onSelectSubmission={goToSubmissionDetail} />;
      }
      return <OwnerDashboard user={user} onSelectUnit={goToUnitDetail} onSelectProject={goToProjectDetail} />;
    }

    // ─── Leader ─────────────────────────────────────────────────────────
    if (user.role === ROLES.LEADER) {
      return <LeaderWorkspace
        user={user}
        onSubmitNew={(subUnitId) => openForm("submit_new", { subUnitId, returnTo: "workspace" })}
        onSelectSubmission={goToSubmissionDetail}
      />;
    }

    // ─── PIC ────────────────────────────────────────────────────────────
    if (user.role === ROLES.PIC) {
      return <PICWorkspace
        user={user}
        onSubmitNew={() => openForm("submit_new", { subUnitId: user.subUnitId, returnTo: "workspace" })}
        onCloseKPI={(submissionId) => openForm("close_kpi", { submissionId, returnTo: "workspace" })}
        onUpdateMonthly={(submissionId) => openForm("update_monthly", { submissionId, returnTo: "workspace" })}
        onSelectSubmission={goToSubmissionDetail}
      />;
    }

    return <div style={{ padding: 20 }}>Role tidak dikenali</div>;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      fontFamily: FONTS.body,
    }}>
      <TopNav
        user={user}
        currentPage={page}
        onNavigate={goToPage}
        onLogout={handleLogout}
      />
      {renderContent()}
    </div>
  );
}

/**
 * App root — wraps the whole UI in the in-session DataStoreProvider so that
 * data edited in one menu stays consistent across all menus during the session.
 */
export default function App() {
  return (
    <DataStoreProvider>
      <AppInner />
    </DataStoreProvider>
  );
}
