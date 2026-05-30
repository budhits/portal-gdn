--
-- PostgreSQL database dump
--

\restrict E7eMuECAcjoXIYFzOvbxiJfXSVocaUMpystZ98K0Nx1tSyodKKQ5GHwZ3D5ylvN

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: audit_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_action AS ENUM (
    'create',
    'update',
    'approve',
    'reject',
    'close',
    'delete'
);


--
-- Name: field_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.field_type AS ENUM (
    'number',
    'text',
    'date',
    'auto'
);


--
-- Name: project_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.project_status AS ENUM (
    'on_track',
    'at_risk',
    'behind',
    'done',
    'pending_approval'
);


--
-- Name: sub_unit_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sub_unit_status AS ENUM (
    'active',
    'inactive'
);


--
-- Name: submission_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.submission_status AS ENUM (
    'estimated',
    'approved',
    'closed',
    'rejected'
);


--
-- Name: template_frequency; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.template_frequency AS ENUM (
    'monthly',
    'cycle',
    'event'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'owner',
    'finance',
    'hr',
    'leader',
    'pic'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id bigint NOT NULL,
    ts timestamp with time zone DEFAULT now() NOT NULL,
    actor_id text,
    action public.audit_action NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    entity_label text DEFAULT ''::text NOT NULL,
    unit_id text,
    details text,
    diff jsonb
);


--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id text NOT NULL,
    project_id text NOT NULL,
    milestone_id text,
    name text NOT NULL,
    amount bigint DEFAULT 0 NOT NULL,
    date date,
    has_receipt boolean DEFAULT false NOT NULL
);


--
-- Name: form_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_fields (
    id bigint NOT NULL,
    template_id text NOT NULL,
    field_key text NOT NULL,
    name text NOT NULL,
    type public.field_type DEFAULT 'number'::public.field_type NOT NULL,
    satuan text DEFAULT ''::text NOT NULL,
    source text DEFAULT 'Manual'::text NOT NULL,
    formula_id text,
    formula_expr text,
    default_weight integer DEFAULT 0 NOT NULL,
    is_margin boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: form_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.form_fields_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: form_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.form_fields_id_seq OWNED BY public.form_fields.id;


--
-- Name: form_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    frequency public.template_frequency DEFAULT 'monthly'::public.template_frequency NOT NULL,
    created_at date DEFAULT CURRENT_DATE NOT NULL
);


--
-- Name: kpi_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_submissions (
    id text NOT NULL,
    template_id text NOT NULL,
    sub_unit_id text NOT NULL,
    unit_id text NOT NULL,
    status public.submission_status DEFAULT 'estimated'::public.submission_status NOT NULL,
    period text NOT NULL,
    estimated_values jsonb DEFAULT '{}'::jsonb NOT NULL,
    actual_values jsonb,
    field_weights jsonb DEFAULT '{}'::jsonb NOT NULL,
    sub_unit_weight integer DEFAULT 0 NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    approved_by text,
    approved_at timestamp with time zone,
    closed_at timestamp with time zone,
    closing_note text,
    daily_margin jsonb
);


--
-- Name: milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.milestones (
    id text NOT NULL,
    project_id text NOT NULL,
    name text NOT NULL,
    done boolean DEFAULT false NOT NULL,
    date date,
    pic text DEFAULT ''::text NOT NULL,
    budget_allocated bigint DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id text NOT NULL,
    unit_id text NOT NULL,
    sub_unit_id text,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status public.project_status DEFAULT 'on_track'::public.project_status NOT NULL,
    milestones_total integer DEFAULT 0 NOT NULL,
    milestones_done integer DEFAULT 0 NOT NULL,
    budget_planned bigint DEFAULT 0 NOT NULL,
    budget_spent bigint DEFAULT 0 NOT NULL,
    start_date date,
    end_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sub_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sub_units (
    id text NOT NULL,
    unit_id text NOT NULL,
    name text NOT NULL,
    pic_id text,
    icon text DEFAULT 'cog'::text NOT NULL,
    status public.sub_unit_status DEFAULT 'active'::public.sub_unit_status NOT NULL,
    weight integer,
    created_at date DEFAULT CURRENT_DATE NOT NULL
);


--
-- Name: units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units (
    id text NOT NULL,
    name text NOT NULL,
    leader_id text,
    color text DEFAULT '#6B6B76'::text NOT NULL,
    color_dark text DEFAULT '#46464E'::text NOT NULL,
    color_light text DEFAULT '#F0F0F2'::text NOT NULL,
    icon text DEFAULT 'cog'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text,
    role public.user_role NOT NULL,
    avatar text DEFAULT ''::text NOT NULL,
    unit_id text,
    sub_unit_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: form_fields id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields ALTER COLUMN id SET DEFAULT nextval('public.form_fields_id_seq'::regclass);


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (id, ts, actor_id, action, entity_type, entity_id, entity_label, unit_id, details, diff) FROM stdin;
1	2026-05-31 16:45:00+00	andi	close	kpi_submission	sub-004	Closing KPI Pixel BDG Pusat	pixel	Pertumbuhan transaksi naik 8% dari bulan lalu, didorong promo Lebaran.	\N
2	2026-05-31 15:20:00+00	budhi	approve	kpi_submission	sub-004	Approve closing Pixel BDG Pusat Mei	pixel	\N	\N
3	2026-05-28 14:30:00+00	rafli	close	kpi_submission	sub-001	Closing KPI Cerelek Siklus Feb-Mei	aquaculture	Panen H+105. SR sedikit di bawah target karena suhu malam turun.	\N
4	2026-05-28 15:00:00+00	budhi	approve	kpi_submission	sub-001	Approve closing Cerelek Siklus Feb-Mei	aquaculture	\N	\N
5	2026-05-22 10:15:00+00	wahyu	close	kpi_submission	sub-003	Closing KPI Cisampih Siklus Feb-Mei	aquaculture	\N	\N
6	2026-05-20 09:30:00+00	wahyu	create	kpi_submission	sub-003	Ajukan KPI Cisampih Siklus Mei-Agu	aquaculture	Estimasi tebar 11.000 ekor, target SR 85%	\N
7	2026-05-17 11:20:00+00	budhi	approve	kpi_submission	sub-002	Approve estimasi Cerelek Siklus Mei-Agu	aquaculture	Bobot SR dinaikkan dari 20% ke 25%	\N
8	2026-05-17 11:18:00+00	budhi	update	weight	sub-002	Update bobot KPI Cerelek Mei-Agu	aquaculture	\N	{"after": "SR: 25%, FCR: 25%", "before": "SR: 20%, FCR: 25%"}
9	2026-05-15 14:00:00+00	rafli	create	kpi_submission	sub-002	Ajukan KPI Cerelek Siklus Mei-Agu	aquaculture	\N	\N
10	2026-05-10 09:00:00+00	budhi	create	sub_unit	rtl-outlet2	Tambah Sub Unit: Outlet Setiabudi	retail	\N	\N
11	2026-05-08 16:30:00+00	budhi	update	user	bayu	Assign Bayu sebagai PIC Outlet Dago	retail	\N	\N
12	2026-05-05 10:00:00+00	sugianto	create	project	pj-202	Ajukan Project: Upgrade Sistem POS	pixel	Estimasi budget Rp 28Jt, target selesai Jun 2026	\N
13	2026-05-05 11:30:00+00	budhi	approve	project	pj-202	Approve project: Upgrade Sistem POS	pixel	\N	\N
14	2026-05-02 13:45:00+00	budhi	approve	kpi_submission	sub-004	Approve estimasi Pixel BDG Pusat Mei	pixel	\N	\N
15	2026-05-01 09:00:00+00	andi	create	kpi_submission	sub-004	Ajukan KPI Pixel BDG Pusat Mei	pixel	\N	\N
16	2026-04-30 17:00:00+00	hendra	close	kpi_submission	sub-h01	Closing KPI Tanjung Blok A April	tanjung	\N	\N
17	2026-04-15 10:20:00+00	budhi	create	form_template	tpl-outlet-retail	Buat template baru: Outlet Retail Bulanan	retail	\N	\N
18	2026-04-10 14:00:00+00	satya	create	project	pj-001	Ajukan Project: Pembukaan Kolam Cerelek 2	aquaculture	\N	\N
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (id, project_id, milestone_id, name, amount, date, has_receipt) FROM stdin;
ex-1	pj-001	ms-1	Survey BPN & dokumen izin	4500000	2026-01-25	t
ex-2	pj-001	ms-2	Batu kali 5 truk	8500000	2026-02-15	t
ex-3	pj-001	ms-2	Semen 100 sak	6700000	2026-02-20	t
ex-4	pj-001	ms-2	Bayar tukang konstruksi H1-H30	18000000	2026-03-15	t
ex-5	pj-001	ms-2	Bayar tukang H31-H60	12000000	2026-03-31	t
ex-6	pj-001	ms-3	Pipa PVC + sambungan	9300000	2026-04-10	t
ex-7	pj-001	ms-3	Blower aerasi 2 unit	8000000	2026-04-25	t
ex-b1	pj-002	ms-b1	Jasa desain sistem biofloc	5000000	2026-03-24	t
ex-f1	pj-101	ms-f1	Jasa desain filter zigzag	4000000	2026-04-12	t
ex-f2	pj-101	ms-f2	Material filter (gravel, zeolit)	7000000	2026-04-22	t
ex-f3	pj-101	ms-f2	Pasir silika + tandon	5000000	2026-05-02	t
ex-f4	pj-101	ms-f3	Upah konstruksi bak filter	11000000	2026-05-18	t
ex-f5	pj-101	ms-f4	Unit UV sterilizer	9000000	2026-06-08	t
ex-f6	pj-101	ms-f5	Pompa + instalasi pipa	4000000	2026-06-27	t
ex-c1	pj-201	ms-c1	Biaya survey & administrasi	3000000	2026-03-18	t
ex-c2	pj-201	ms-c2	Sewa tempat 1 tahun	12000000	2026-04-15	t
ex-c3	pj-201	ms-c2	Renovasi & cat cabang	6000000	2026-04-28	t
ex-c4	pj-201	ms-c3	Komputer + perangkat server	12000000	2026-05-28	t
ex-c5	pj-201	ms-c4	Honor training staff	6000000	2026-06-22	t
ex-p1	pj-202	ms-p1	Jasa analisa kebutuhan sistem	4000000	2026-02-22	t
ex-r1	pj-301	ms-r1	Riset brand & moodboard	5000000	2026-02-03	t
ex-r2	pj-301	ms-r2	Jasa desain logo & identitas	12000000	2026-03-20	t
ex-s1	pj-302	ms-s1	Jasa desain interior	6000000	2026-02-18	t
ex-s2	pj-302	ms-s2	Upah bongkar & persiapan	8000000	2026-03-12	t
ex-s3	pj-302	ms-s3	Material renovasi & cat	14000000	2026-04-10	t
ex-s4	pj-302	ms-s3	Upah tukang renovasi	6000000	2026-04-20	t
ex-s5	pj-302	ms-s4	Signage & neon box	10000000	2026-05-12	t
ex-s6	pj-302	ms-s5	Furnitur & display produk	6000000	2026-06-02	t
ex-x1	pj-401	ms-x1	Honor analisa & spesifikasi	10000000	2026-02-28	t
ex-x2	pj-401	ms-x2	Honor desain DB & UI	15000000	2026-04-05	t
\.


--
-- Data for Name: form_fields; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.form_fields (id, template_id, field_key, name, type, satuan, source, formula_id, formula_expr, default_weight, is_margin, sort_order) FROM stdin;
1	tpl-kolam-deder	f1	Tanggal_Tebar	date		Manual	\N	\N	0	f	0
2	tpl-kolam-deder	f2	Tanggal_Panen	date		Manual	\N	\N	0	f	1
3	tpl-kolam-deder	f3	Tebar	number	ekor	Manual	\N	\N	0	f	2
4	tpl-kolam-deder	f4	SR	number	%	Manual	\N	\N	25	f	3
5	tpl-kolam-deder	f5	Bobot_per_Ekor	number	gr	Manual	\N	\N	0	f	4
6	tpl-kolam-deder	f6	FCR	number	x	Manual	\N	\N	25	f	5
7	tpl-kolam-deder	f7	Harga_Jual	number	Rp	Manual	\N	\N	0	f	6
8	tpl-kolam-deder	f8	Harga_Benih_per_ekor	number	Rp	Manual	\N	\N	0	f	7
9	tpl-kolam-deder	f9	Harga_Pakan	number	Rp/kg	Manual	\N	\N	0	f	8
10	tpl-kolam-deder	f10	Biaya_Borongan_Panen	number	Rp	Manual	\N	\N	0	f	9
11	tpl-kolam-deder	f11	Biaya_per_kg_Panen	number	Rp/kg	Manual	\N	\N	0	f	10
12	tpl-kolam-deder	f12	Biaya_Pemeliharaan_per_kg	number	Rp/kg	Manual	\N	\N	0	f	11
13	tpl-kolam-deder	f13	Biaya_CapEx	number	Rp	Manual	\N	\N	0	f	12
14	tpl-kolam-deder	f14	Biaya_Lain-lain	number	Rp	Manual	\N	\N	0	f	13
15	tpl-kolam-deder	f15	Panen	auto	ekor	Formula	panen_dari_sr	\N	0	f	14
16	tpl-kolam-deder	f16	Berat_Panen	auto	kg	Formula	berat_dari_bobot	\N	0	f	15
17	tpl-kolam-deder	f17	Pakan	auto	kg	Formula	pakan_dari_fcr	\N	0	f	16
18	tpl-kolam-deder	f18	HPP_Benih	auto	Rp	Formula	hpp_benih_ekor	\N	0	f	17
19	tpl-kolam-deder	f19	HPP_Pakan	auto	Rp	Formula	hpp_pakan	\N	0	f	18
20	tpl-kolam-deder	f20	Total_Biaya	auto	Rp	Formula	total_biaya_komponen	\N	0	f	19
21	tpl-kolam-deder	f21	HPP	auto	Rp/kg	Formula	hpp_dari_total	\N	25	f	20
22	tpl-kolam-deder	f22	Omset	auto	Rp	Formula	omset	\N	0	f	21
23	tpl-kolam-deder	f23	Margin	auto	Rp	Formula	margin_dari_total	\N	25	t	22
24	tpl-kolam-pembesaran	f1	Tanggal_Tebar	date		Manual	\N	\N	0	f	0
25	tpl-kolam-pembesaran	f2	Tanggal_Panen	date		Manual	\N	\N	0	f	1
26	tpl-kolam-pembesaran	f3	Kg_Tebar	number	kg	Manual	\N	\N	0	f	2
27	tpl-kolam-pembesaran	f4	Ukuran_Tebar	number	gr	Manual	\N	\N	0	f	3
28	tpl-kolam-pembesaran	f5	SR	number	%	Manual	\N	\N	25	f	4
29	tpl-kolam-pembesaran	f6	Bobot_per_Ekor	number	gr	Manual	\N	\N	0	f	5
30	tpl-kolam-pembesaran	f7	FCR	number	x	Manual	\N	\N	25	f	6
31	tpl-kolam-pembesaran	f8	Harga_Jual	number	Rp	Manual	\N	\N	0	f	7
32	tpl-kolam-pembesaran	f9	Harga_Benih_per_kg	number	Rp/kg	Manual	\N	\N	0	f	8
33	tpl-kolam-pembesaran	f10	Harga_Pakan	number	Rp/kg	Manual	\N	\N	0	f	9
34	tpl-kolam-pembesaran	f11	Biaya_Borongan_Panen	number	Rp	Manual	\N	\N	0	f	10
35	tpl-kolam-pembesaran	f12	Biaya_per_kg_Panen	number	Rp/kg	Manual	\N	\N	0	f	11
36	tpl-kolam-pembesaran	f13	Biaya_Pemeliharaan_per_kg	number	Rp/kg	Manual	\N	\N	0	f	12
37	tpl-kolam-pembesaran	f14	Biaya_CapEx	number	Rp	Manual	\N	\N	0	f	13
38	tpl-kolam-pembesaran	f15	Biaya_Lain-lain	number	Rp	Manual	\N	\N	0	f	14
39	tpl-kolam-pembesaran	f16	Tebar	auto	ekor	Formula	populasi_dari_kg	\N	0	f	15
40	tpl-kolam-pembesaran	f17	Panen	auto	ekor	Formula	panen_dari_sr	\N	0	f	16
41	tpl-kolam-pembesaran	f18	Berat_Panen	auto	kg	Formula	berat_dari_bobot	\N	0	f	17
42	tpl-kolam-pembesaran	f19	Pakan	auto	kg	Formula	pakan_dari_fcr	\N	0	f	18
43	tpl-kolam-pembesaran	f20	HPP_Benih	auto	Rp	Formula	hpp_benih_kg	\N	0	f	19
44	tpl-kolam-pembesaran	f21	HPP_Pakan	auto	Rp	Formula	hpp_pakan	\N	0	f	20
45	tpl-kolam-pembesaran	f22	Total_Biaya	auto	Rp	Formula	total_biaya_komponen	\N	0	f	21
46	tpl-kolam-pembesaran	f23	HPP	auto	Rp/kg	Formula	hpp_dari_total	\N	25	f	22
47	tpl-kolam-pembesaran	f24	Omset	auto	Rp	Formula	omset	\N	0	f	23
48	tpl-kolam-pembesaran	f25	Margin	auto	Rp	Formula	margin_dari_total	\N	25	t	24
49	tpl-cabang-pulsa	f1	Jumlah_Transaksi	number	trx	Manual	\N	\N	25	f	0
50	tpl-cabang-pulsa	f2	Omset	number	Rp	Pembukuan	\N	\N	25	f	1
51	tpl-cabang-pulsa	f3	Total_Biaya	number	Rp	Pembukuan	\N	\N	0	f	2
52	tpl-cabang-pulsa	f4	Total_Agen	number	orang	Manual	\N	\N	0	f	3
53	tpl-cabang-pulsa	f5	Agen_Aktif	number	orang	Manual	\N	\N	0	f	4
54	tpl-cabang-pulsa	f6	Aktivasi_Agen	auto	%	Formula	aktivasi_agen	\N	20	f	5
55	tpl-cabang-pulsa	f7	Rata²_per_Trx	auto	Rp	Formula	avg_per_trx	\N	10	f	6
56	tpl-cabang-pulsa	f8	Margin	auto	Rp	Formula	margin	\N	20	t	7
57	tpl-outlet-retail	f1	Omset	number	Rp	Pembukuan	\N	\N	30	f	0
58	tpl-outlet-retail	f2	Total_Biaya	number	Rp	Pembukuan	\N	\N	0	f	1
59	tpl-outlet-retail	f3	Jumlah_Pelanggan	number	orang	Manual	\N	\N	20	f	2
60	tpl-outlet-retail	f4	Stock_Loss	number	Rp	Manual	\N	\N	20	f	3
61	tpl-outlet-retail	f5	Margin	auto	Rp	Formula	margin	\N	30	t	4
\.


--
-- Data for Name: form_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.form_templates (id, name, description, frequency, created_at) FROM stdin;
tpl-kolam-deder	Kolam Deder	Template KPI untuk siklus pendederan ikan (larva → benih)	cycle	2026-01-10
tpl-kolam-pembesaran	Kolam Pembesaran	Template KPI untuk siklus pembesaran ikan konsumsi	cycle	2026-01-10
tpl-cabang-pulsa	Cabang Pulsa Bulanan	Template KPI bulanan untuk cabang distribusi pulsa	monthly	2026-01-15
tpl-outlet-retail	Outlet Retail Bulanan	Template KPI bulanan untuk outlet retail	monthly	2026-02-01
\.


--
-- Data for Name: kpi_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_submissions (id, template_id, sub_unit_id, unit_id, status, period, estimated_values, actual_values, field_weights, sub_unit_weight, created_by, created_at, approved_by, approved_at, closed_at, closing_note, daily_margin) FROM stdin;
sub-001	tpl-kolam-deder	aqua-cerelek	aquaculture	closed	Siklus Feb-Mei 2026	{"f3": 12000, "f4": 85, "f5": 250, "f6": 1.2, "f7": 22000, "f8": 150, "f9": 12000, "f10": 1500000, "f11": 1200, "f12": 8000, "f13": 3000000, "f14": 1000000}	{"f3": 12000, "f4": 85, "f5": 250, "f6": 1.24, "f7": 22000, "f8": 150, "f9": 12500, "f10": 1800000, "f11": 1300, "f12": 8500, "f13": 3000000, "f14": 1200000}	{"f4": 25, "f6": 25, "f21": 25, "f23": 25}	40	rafli	2026-02-10 00:00:00+00	budhi	2026-02-12 00:00:00+00	2026-05-28 00:00:00+00	Panen dilakukan H+105. SR sedikit di bawah target karena suhu malam turun di minggu ke-8.	\N
sub-002	tpl-kolam-deder	aqua-cerelek	aquaculture	approved	Siklus Mei-Agu 2026	{"f3": 13000, "f4": 87, "f5": 260, "f6": 1.18, "f7": 23000, "f8": 155, "f9": 12500, "f10": 1600000, "f11": 1250, "f12": 8200, "f13": 3000000, "f14": 1100000}	\N	{"f4": 25, "f6": 25, "f21": 25, "f23": 25}	40	rafli	2026-05-15 00:00:00+00	budhi	2026-05-17 00:00:00+00	\N	\N	\N
sub-003	tpl-kolam-deder	aqua-cisampih	aquaculture	estimated	Siklus Mei-Agu 2026	{"f3": 11000, "f4": 84, "f5": 240, "f6": 1.25, "f7": 22000, "f8": 150, "f9": 12000, "f10": 1400000, "f11": 1200, "f12": 7800, "f13": 2800000, "f14": 900000}	\N	{}	35	wahyu	2026-05-20 00:00:00+00	\N	\N	\N	\N	\N
sub-004	tpl-cabang-pulsa	pix-bdg-pusat	pixel	approved	Mei 2026	{"f1": 9500, "f2": 380000000, "f3": 32000000, "f4": 150, "f5": 130}	{"f1": 9800, "f2": 412000000, "f3": 35000000, "f4": 152, "f5": 138}	{"f1": 25, "f2": 25, "f6": 20, "f7": 10, "f8": 20}	70	andi	2026-05-01 00:00:00+00	budhi	2026-05-02 00:00:00+00	\N	\N	\N
sub-005	tpl-cabang-pulsa	pix-bdg-timur	pixel	closed	Mei 2026	{"f1": 5000, "f2": 150000000, "f3": 12000000, "f4": 80, "f5": 65}	{"f1": 4200, "f2": 96000000, "f3": 10000000, "f4": 78, "f5": 48}	{"f1": 25, "f2": 25, "f6": 20, "f7": 10, "f8": 20}	30	rina	2026-05-01 00:00:00+00	budhi	2026-05-03 00:00:00+00	2026-05-31 00:00:00+00	Cabang baru (buka Mar 2026), masih tahap pengembangan jaringan agen. Margin 96jt dari target 150jt — agen aktif baru 48 dari 78 terdaftar. Fokus Juni: aktivasi agen tidur.	\N
sub-006	tpl-cabang-pulsa	tjg-blok-a	tanjung	closed	Mei 2026	{"f1": 6000, "f2": 40000000, "f3": 2500000, "f4": 60, "f5": 50}	{"f1": 6300, "f2": 37500000, "f3": 2300000, "f4": 62, "f5": 54}	{"f1": 25, "f2": 25, "f6": 20, "f7": 10, "f8": 20}	60	hendra	2026-05-01 00:00:00+00	budhi	2026-05-02 00:00:00+00	2026-05-31 00:00:00+00	Produksi stabil, margin 37.5jt mendekati target 40jt. Performa baik.	\N
sub-007	tpl-cabang-pulsa	tjg-blok-b	tanjung	closed	Mei 2026	{"f1": 4500, "f2": 30000000, "f3": 2000000, "f4": 45, "f5": 38}	{"f1": 4000, "f2": 21000000, "f3": 1900000, "f4": 44, "f5": 30}	{"f1": 25, "f2": 25, "f6": 20, "f7": 10, "f8": 20}	40	taufik	2026-05-01 00:00:00+00	budhi	2026-05-03 00:00:00+00	2026-05-31 00:00:00+00	Margin 21jt di bawah target 30jt. Blok B belum punya PIC tetap — input oleh Leader. Perlu penugasan PIC.	\N
sub-008	tpl-outlet-retail	rtl-outlet1	retail	closed	Mei 2026	{"f1": 85000000, "f2": 0, "f3": 1200, "f4": 1500000}	{"f1": 72000000, "f2": 0, "f3": 1150, "f4": 1800000}	{"f1": 30, "f3": 20, "f4": 20, "f5": 30}	60	bayu	2026-05-01 00:00:00+00	ferry	2026-05-02 00:00:00+00	2026-05-31 00:00:00+00	Omset 72jt dari target 85jt. Stock loss naik sedikit, perlu kontrol inventaris.	\N
sub-009	tpl-outlet-retail	rtl-outlet2	retail	closed	Mei 2026	{"f1": 55000000, "f2": 0, "f3": 900, "f4": 1200000}	{"f1": 44000000, "f2": 0, "f3": 820, "f4": 2100000}	{"f1": 30, "f3": 20, "f4": 20, "f5": 30}	40	ferry	2026-05-01 00:00:00+00	budhi	2026-05-03 00:00:00+00	2026-05-31 00:00:00+00	Omset 44jt di bawah target 55jt. Outlet belum punya PIC tetap — input oleh Leader. Stock loss tinggi perlu perhatian.	\N
sub-010	tpl-cabang-pulsa	xpc-main	xpanca	closed	Mei 2026	{"f1": 12000, "f2": 120000000, "f3": 9000000, "f4": 200, "f5": 170}	{"f1": 13500, "f2": 138000000, "f3": 9500000, "f4": 205, "f5": 188}	{"f1": 25, "f2": 25, "f6": 20, "f7": 10, "f8": 20}	100	fahrizal	2026-05-01 00:00:00+00	budhi	2026-05-02 00:00:00+00	2026-05-31 00:00:00+00	Margin 138jt melampaui target 120jt. Performa sangat baik, distribusi tumbuh pesat.	\N
sub-011	tpl-kolam-pembesaran	aqua-ciwastra	aquaculture	approved	Siklus Apr-Jul 2026	{"f3": 15000, "f4": 85, "f5": 200, "f6": 1.2, "f7": 24000, "f8": 180}	\N	{"f4": 25, "f6": 25, "f21": 25, "f25": 25}	30	satya	2026-04-10 00:00:00+00	budhi	2026-04-12 00:00:00+00	\N	\N	\N
\.


--
-- Data for Name: milestones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.milestones (id, project_id, name, done, date, pic, budget_allocated, sort_order) FROM stdin;
ms-1	pj-001	Survey & izin lahan	t	2026-01-31	Pa Wahyu	6000000	0
ms-2	pj-001	Konstruksi kolam	t	2026-03-31	Pa Wahyu	60000000	1
ms-3	pj-001	Instalasi pipa & aerasi	t	2026-04-30	Andi	25000000	2
ms-4	pj-001	Uji coba sistem air	f	2026-05-31	Rizal	9000000	3
ms-5	pj-001	Stocking benih perdana	f	2026-06-15	Rizal	35000000	4
ms-6	pj-001	Panen perdana & evaluasi	f	2026-09-20	Satya	20000000	5
ms-7	pj-001	Operasional penuh	f	2026-12-31	Satya	25000000	6
ms-b1	pj-002	Desain sistem biofloc	t	2026-03-20	Satya	5000000	0
ms-b2	pj-002	Pengadaan peralatan aerasi	f	2026-05-15	Satya	18000000	1
ms-b3	pj-002	Instalasi kolam percontohan	f	2026-07-10	Rizal	14000000	2
ms-b4	pj-002	Uji coba & kalibrasi	f	2026-08-20	Rizal	5000000	3
ms-b5	pj-002	Migrasi penuh semua kolam	f	2026-09-30	Satya	3000000	4
ms-f1	pj-101	Desain filter zigzag	t	2026-04-10	Taufik	4000000	0
ms-f2	pj-101	Pengadaan material filter	t	2026-04-25	Hendra	12000000	1
ms-f3	pj-101	Konstruksi bak filter	t	2026-05-15	Hendra	11000000	2
ms-f4	pj-101	Instalasi UV sterilizer	t	2026-06-05	Hendra	9000000	3
ms-f5	pj-101	Pemasangan pompa & pipa	t	2026-06-25	Taufik	4000000	4
ms-f6	pj-101	Uji aliran & tekanan	f	2026-07-10	Taufik	2000000	5
ms-f7	pj-101	Commissioning sistem	f	2026-07-25	Taufik	1000000	6
ms-c1	pj-201	Survey lokasi cabang	t	2026-03-15	Rina	3000000	0
ms-c2	pj-201	Sewa & renovasi tempat	t	2026-04-20	Rina	18000000	1
ms-c3	pj-201	Pengadaan perangkat	t	2026-05-25	Sugianto	12000000	2
ms-c4	pj-201	Rekrut & training staff	t	2026-06-20	Sugianto	6000000	3
ms-c5	pj-201	Soft opening	f	2026-08-01	Rina	4000000	4
ms-c6	pj-201	Grand opening & promo	f	2026-09-15	Rina	2000000	5
ms-p1	pj-202	Analisa kebutuhan sistem	t	2026-02-20	Sugianto	4000000	0
ms-p2	pj-202	Pembelian lisensi POS	f	2026-03-25	Sugianto	12000000	1
ms-p3	pj-202	Setup & konfigurasi	f	2026-04-30	Andi	6000000	2
ms-p4	pj-202	Migrasi data lama	f	2026-05-25	Andi	4000000	3
ms-p5	pj-202	Training kasir & go-live	f	2026-06-25	Sugianto	2000000	4
ms-r1	pj-301	Riset & moodboard brand	t	2026-01-31	Ferry	5000000	0
ms-r2	pj-301	Desain logo & identitas	t	2026-03-15	Ferry	12000000	1
ms-r3	pj-301	Pembuatan website baru	f	2026-04-30	Ferry	13000000	2
ms-r4	pj-301	Produksi materi marketing	f	2026-05-31	Ferry	3000000	3
ms-r5	pj-301	Peluncuran brand baru	f	2026-06-25	Ferry	2000000	4
ms-s1	pj-302	Desain interior outlet	t	2026-02-15	Ferry	6000000	0
ms-s2	pj-302	Pembongkaran & persiapan	t	2026-03-10	Bayu	8000000	1
ms-s3	pj-302	Renovasi struktur & cat	t	2026-04-15	Bayu	20000000	2
ms-s4	pj-302	Pemasangan signage	t	2026-05-10	Bayu	10000000	3
ms-s5	pj-302	Furnishing & display	t	2026-05-30	Ferry	6000000	4
ms-s6	pj-302	Soft launch outlet	f	2026-06-15	Ferry	2000000	5
ms-x1	pj-401	Analisa & spesifikasi	t	2026-02-25	Fahrizal	10000000	0
ms-x2	pj-401	Desain database & UI	t	2026-03-31	Fahrizal	15000000	1
ms-x3	pj-401	Pengembangan modul order	f	2026-05-15	Fahrizal	20000000	2
ms-x4	pj-401	Modul stok & laporan	f	2026-06-30	Fahrizal	20000000	3
ms-x5	pj-401	Integrasi & testing	f	2026-07-31	Fahrizal	12000000	4
ms-x6	pj-401	Deployment & training	f	2026-08-25	Fahrizal	8000000	5
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, unit_id, sub_unit_id, name, description, status, milestones_total, milestones_done, budget_planned, budget_spent, start_date, end_date, created_at) FROM stdin;
pj-001	aquaculture	aqua-cerelek	Pembukaan Kolam Cerelek 2	Ekspansi 8 kolam baru kapasitas 5 ton/siklus	on_track	7	3	180000000	67000000	2026-01-15	2026-12-31	2026-05-30 10:51:29.574981+00
pj-002	aquaculture	\N	Implementasi Sistem Biofloc	Migrasi semua kolam ke biofloc system	at_risk	5	1	45000000	18000000	2026-03-01	2026-09-30	2026-05-30 10:51:29.574981+00
pj-101	tanjung	tjg-blok-a	Instalasi Filter Multi-tahap	Sistem filter 10x2m zigzag + UV sterilization	on_track	8	5	43000000	26000000	2026-04-01	2026-07-31	2026-05-30 10:51:29.574981+00
pj-201	pixel	pix-bdg-timur	Setup Cabang Bandung Timur	Buka cabang baru target 5rb trx/bulan	on_track	6	4	45000000	22000000	2026-03-01	2026-09-30	2026-05-30 10:51:29.574981+00
pj-202	pixel	\N	Upgrade Sistem POS	Ganti sistem kasir ke POS terintegrasi	behind	5	1	28000000	19000000	2026-02-01	2026-06-30	2026-05-30 10:51:29.574981+00
pj-301	retail	\N	Rebranding Gera Creative	Redesign identitas brand & website	behind	5	2	35000000	28000000	2026-01-15	2026-06-30	2026-05-30 10:51:29.574981+00
pj-302	retail	rtl-outlet2	Renovasi Outlet Setiabudi	Renovasi interior & signage outlet baru	on_track	6	5	52000000	45000000	2026-02-01	2026-06-15	2026-05-30 10:51:29.574981+00
pj-401	xpanca	\N	Pengembangan Software Distribusi	Sistem digital order, stok, laporan	at_risk	7	2	85000000	18000000	2026-02-01	2026-08-31	2026-05-30 10:51:29.574981+00
\.


--
-- Data for Name: sub_units; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sub_units (id, unit_id, name, pic_id, icon, status, weight, created_at) FROM stdin;
aqua-cerelek	aquaculture	Kolam Cerelek	rafli	fish	active	\N	2025-08-15
aqua-cisampih	aquaculture	Kolam Cisampih	wahyu	water	active	\N	2025-08-15
aqua-ciwastra	aquaculture	Kolam Ciwastra	\N	fish	active	\N	2026-01-10
tjg-blok-a	tanjung	Tanjung Blok A	hendra	water	active	\N	2025-09-01
tjg-blok-b	tanjung	Tanjung Blok B	\N	water	active	\N	2025-09-01
pix-bdg-pusat	pixel	Cabang Bandung Pusat	andi	signal	active	\N	2024-03-01
pix-bdg-timur	pixel	Cabang Bandung Timur	rina	signal	active	\N	2026-03-15
rtl-outlet1	retail	Outlet Dago	bayu	store	active	\N	2025-06-01
rtl-outlet2	retail	Outlet Setiabudi	\N	store	active	\N	2025-11-01
xpc-main	xpanca	Xpanca Utama	\N	cog	active	\N	2024-01-01
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.units (id, name, leader_id, color, color_dark, color_light, icon, created_at) FROM stdin;
pixel	Pixel Telemedia	sugianto	#3B7BC4	#2C5F9E	#E7F0F8	signal	2026-05-30 10:51:29.574981+00
retail	KK / Retail	ferry	#C9A45C	#9A7B3E	#F4ECDB	store	2026-05-30 10:51:29.574981+00
aquaculture	Aquaculture	satya	#5B9B47	#3F6E31	#EAF3E5	fish	2026-05-30 10:51:29.574981+00
tanjung	Kolam Tanjung	taufik	#3B9BA4	#2A6E75	#E4F2F3	water	2026-05-30 10:51:29.574981+00
xpanca	Xpanca	fahrizal	#7A6CB0	#564B80	#ECE9F4	cog	2026-05-30 10:51:29.574981+00
menjala	Menjala	\N	#6B6B76	#46464E	#F0F0F2	fish	2026-05-30 10:51:29.574981+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, role, avatar, unit_id, sub_unit_id, created_at, updated_at) FROM stdin;
budhi	Budhi	budhi@email.com	$2a$10$4QDAFSaehTvFrq9KK2DWb.z0dApDNjbJMl8OvQuUy5ndBlZZ10iA2	admin		\N	\N	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
rarra	Rarra	rarra@email.com	$2a$10$InQ62O3PFWNI7hlXCBIBfuvyVuG7S5GMQ2A3gCTAgsPRq0a9rABOa	owner		\N	\N	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
lovia	Lovia	lovia@email.com	$2a$10$AykfHqpo2ipWgptjCXYGEec13hfVHbzgbkVXHCzAcDzlyJGUKOVnu	finance		\N	\N	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
didi	Didi	didi@email.com	$2a$10$MqA6L6lNUP4OTlh9/vBqD.1.D4cLR7gsVEHj7ZpO69XUkdkc80sf.	hr		\N	\N	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
satya	Satya	satya@email.com	$2a$10$uzmjX2awgM9665Q8G2FV2erssIFr.Zj75OEStpRwkETKrBb8jEQNy	leader		aquaculture	\N	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
taufik	Taufik	taufik@email.com	$2a$10$4J6lJMzNpJ7YtksoVaLC/eEWlTdJnahaK4B5OitTrh5jiNB/2I08O	leader		tanjung	\N	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
fahrizal	Fahrizal	fahrizal@email.com	$2a$10$0SypbDrnBArsrWEm5ZB8quQLWAMKrMzk7aMxfk4Cn6QVcv4iz/0n6	leader		xpanca	\N	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
sugianto	Sugianto	sugianto@email.com	$2a$10$1qGmiZa0w1Umb2wHOfSG7ucQQpK.lkl75V5DfobO66VBJcqbZNSwS	leader		pixel	\N	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
ferry	Ferry	ferry@email.com	$2a$10$MXCTapt8X/RerCMl..yjvOIUFFrcaK0yOMDnNnCSZje01M8Q9oX96	leader		retail	\N	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
rafli	Rafli	rafli@email.com	$2a$10$sMkXmlmkhue1u1PW/r4YSuS7hvxS3ELfbxBe8BiLwN1JtgOGNCrWK	pic		aquaculture	aqua-cerelek	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
wahyu	Wahyu	wahyu@email.com	$2a$10$1prjRIok8FyyEDV4iKwGF.syl/MLUyGHMRnqRn0K0d9tLSUaPoil6	pic		aquaculture	aqua-cisampih	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
hendra	Hendra	hendra@email.com	$2a$10$tWAuJpS2NfbmB/w4lu7iZOECztR44Qoh88u10SOt/B0k2Mtl9EoSO	pic		tanjung	tjg-blok-a	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
andi	Andi	andi@email.com	$2a$10$wfQTjGDlskGauJTBdNYXNOMEXL0sC8vng11tncp5yMt5xuzItmQ5K	pic		pixel	pix-bdg-pusat	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
rina	Rina	rina@email.com	$2a$10$0JyvRYWyc0gg2VgWD6L4DeBGYgFrBQ//eoUQ36ZpD6Q00NhjigJj6	pic		pixel	pix-bdg-timur	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
bayu	Bayu	bayu@email.com	$2a$10$sLdZsKGcvpxMWiUu3Rhz3ec1xlEh.owvKC..1oKMmTn62pNQYxw5m	pic		retail	rtl-outlet1	2026-05-30 10:51:29.574981+00	2026-05-30 10:51:29.574981+00
\.


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 18, true);


--
-- Name: form_fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.form_fields_id_seq', 61, true);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: form_fields form_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields
    ADD CONSTRAINT form_fields_pkey PRIMARY KEY (id);


--
-- Name: form_fields form_fields_template_id_field_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields
    ADD CONSTRAINT form_fields_template_id_field_key_key UNIQUE (template_id, field_key);


--
-- Name: form_templates form_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_pkey PRIMARY KEY (id);


--
-- Name: kpi_submissions kpi_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_submissions
    ADD CONSTRAINT kpi_submissions_pkey PRIMARY KEY (id);


--
-- Name: milestones milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT milestones_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: sub_units sub_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_units
    ADD CONSTRAINT sub_units_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_actor ON public.audit_log USING btree (actor_id);


--
-- Name: idx_audit_ts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_ts ON public.audit_log USING btree (ts DESC);


--
-- Name: idx_audit_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_unit ON public.audit_log USING btree (unit_id);


--
-- Name: idx_expenses_milestone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_milestone ON public.expenses USING btree (milestone_id);


--
-- Name: idx_expenses_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_project ON public.expenses USING btree (project_id);


--
-- Name: idx_form_fields_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_fields_template ON public.form_fields USING btree (template_id);


--
-- Name: idx_milestones_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_milestones_project ON public.milestones USING btree (project_id);


--
-- Name: idx_projects_sub_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_sub_unit ON public.projects USING btree (sub_unit_id);


--
-- Name: idx_projects_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_unit ON public.projects USING btree (unit_id);


--
-- Name: idx_sub_units_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sub_units_unit ON public.sub_units USING btree (unit_id);


--
-- Name: idx_submissions_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_period ON public.kpi_submissions USING btree (period);


--
-- Name: idx_submissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_status ON public.kpi_submissions USING btree (status);


--
-- Name: idx_submissions_sub_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_sub_unit ON public.kpi_submissions USING btree (sub_unit_id);


--
-- Name: idx_submissions_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_unit ON public.kpi_submissions USING btree (unit_id);


--
-- Name: audit_log audit_log_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: expenses expenses_milestone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.milestones(id) ON DELETE SET NULL;


--
-- Name: expenses expenses_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: users fk_users_sub_unit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_sub_unit FOREIGN KEY (sub_unit_id) REFERENCES public.sub_units(id) ON DELETE SET NULL;


--
-- Name: users fk_users_unit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_unit FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;


--
-- Name: form_fields form_fields_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields
    ADD CONSTRAINT form_fields_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_templates(id) ON DELETE CASCADE;


--
-- Name: kpi_submissions kpi_submissions_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_submissions
    ADD CONSTRAINT kpi_submissions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kpi_submissions kpi_submissions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_submissions
    ADD CONSTRAINT kpi_submissions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kpi_submissions kpi_submissions_sub_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_submissions
    ADD CONSTRAINT kpi_submissions_sub_unit_id_fkey FOREIGN KEY (sub_unit_id) REFERENCES public.sub_units(id) ON DELETE CASCADE;


--
-- Name: kpi_submissions kpi_submissions_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_submissions
    ADD CONSTRAINT kpi_submissions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_templates(id) ON DELETE RESTRICT;


--
-- Name: kpi_submissions kpi_submissions_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_submissions
    ADD CONSTRAINT kpi_submissions_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: milestones milestones_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_sub_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_sub_unit_id_fkey FOREIGN KEY (sub_unit_id) REFERENCES public.sub_units(id) ON DELETE SET NULL;


--
-- Name: projects projects_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: sub_units sub_units_pic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_units
    ADD CONSTRAINT sub_units_pic_id_fkey FOREIGN KEY (pic_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: sub_units sub_units_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_units
    ADD CONSTRAINT sub_units_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: units units_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict E7eMuECAcjoXIYFzOvbxiJfXSVocaUMpystZ98K0Nx1tSyodKKQ5GHwZ3D5ylvN

