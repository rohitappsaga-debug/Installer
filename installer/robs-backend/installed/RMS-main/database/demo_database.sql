--
-- PostgreSQL database dump
--

\restrict TdfXl0RQ2ebzWHE5xhyJZ5P0MtCOftzZFNlfRGEh4kC0gUqimE2zdZrFZFr1eSL

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-02-11 16:01:11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 35868)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 5233 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 883 (class 1247 OID 35912)
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'order',
    'payment',
    'alert'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- TOC entry 877 (class 1247 OID 35890)
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'pending',
    'preparing',
    'ready',
    'served',
    'delivered',
    'cancelled'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- TOC entry 880 (class 1247 OID 35904)
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'cash',
    'card',
    'upi'
);


ALTER TYPE public."PaymentMethod" OWNER TO postgres;

--
-- TOC entry 886 (class 1247 OID 35920)
-- Name: ReservationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReservationStatus" AS ENUM (
    'pending',
    'checked_in',
    'cancelled',
    'expired'
);


ALTER TYPE public."ReservationStatus" OWNER TO postgres;

--
-- TOC entry 874 (class 1247 OID 35882)
-- Name: TableStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TableStatus" AS ENUM (
    'free',
    'occupied',
    'reserved'
);


ALTER TYPE public."TableStatus" OWNER TO postgres;

--
-- TOC entry 871 (class 1247 OID 35870)
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'waiter',
    'admin',
    'kitchen',
    'manager',
    'delivery'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 229 (class 1259 OID 36101)
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id text NOT NULL,
    user_id text NOT NULL,
    action character varying(100) NOT NULL,
    details text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 36113)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 36084)
-- Name: daily_sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_sales (
    id text NOT NULL,
    date date NOT NULL,
    total_sales numeric(10,2) DEFAULT 0 NOT NULL,
    total_orders integer DEFAULT 0 NOT NULL,
    average_order_value numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.daily_sales OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 36127)
-- Name: delivery_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_details (
    id text NOT NULL,
    order_id text NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    address text NOT NULL,
    driver_id text,
    delivery_status text DEFAULT 'pending'::text NOT NULL
);


ALTER TABLE public.delivery_details OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 36141)
-- Name: ingredients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ingredients (
    id text NOT NULL,
    name text NOT NULL,
    unit text NOT NULL,
    stock numeric(10,3) DEFAULT 0 NOT NULL,
    min_level numeric(10,3) DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ingredients OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 36158)
-- Name: menu_item_modifiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_item_modifiers (
    id text NOT NULL,
    menu_item_id text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    available boolean DEFAULT true NOT NULL
);


ALTER TABLE public.menu_item_modifiers OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 35962)
-- Name: menu_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_items (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    category character varying(50) NOT NULL,
    price numeric(10,2) NOT NULL,
    description text,
    image_url character varying(255),
    available boolean DEFAULT true NOT NULL,
    preparation_time integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    category_id text,
    available_from text,
    available_to text,
    is_veg boolean DEFAULT true NOT NULL,
    availability_reason text
);


ALTER TABLE public.menu_items OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 36041)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    type public."NotificationType" NOT NULL,
    message text NOT NULL,
    user_id text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 36006)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    order_id text NOT NULL,
    menu_item_id text NOT NULL,
    quantity integer NOT NULL,
    notes text,
    status public."OrderStatus" DEFAULT 'pending'::public."OrderStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    modifiers jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 35983)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id text NOT NULL,
    table_number integer,
    status public."OrderStatus" DEFAULT 'pending'::public."OrderStatus" NOT NULL,
    created_by text NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    discount_type character varying(20),
    discount_value numeric(10,2) DEFAULT 0,
    is_paid boolean DEFAULT false NOT NULL,
    payment_method public."PaymentMethod",
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    cancel_reason text,
    hold_status boolean DEFAULT false NOT NULL,
    order_number integer NOT NULL,
    parent_order_id text
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 35982)
-- Name: orders_order_number_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_order_number_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_order_number_seq OWNER TO postgres;

--
-- TOC entry 5235 (class 0 OID 0)
-- Dependencies: 222
-- Name: orders_order_number_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_order_number_seq OWNED BY public.orders.order_number;


--
-- TOC entry 234 (class 1259 OID 36171)
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_transactions (
    id text NOT NULL,
    order_id text NOT NULL,
    amount numeric(10,2) NOT NULL,
    method public."PaymentMethod" NOT NULL,
    status text NOT NULL,
    transaction_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payment_transactions OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 36185)
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_order_items (
    id text NOT NULL,
    purchase_order_id text NOT NULL,
    ingredient_id text NOT NULL,
    quantity numeric(10,3) NOT NULL,
    unit_cost numeric(10,2) NOT NULL
);


ALTER TABLE public.purchase_order_items OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 36197)
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_orders (
    id text NOT NULL,
    supplier_id text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    total_cost numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.purchase_orders OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 36213)
-- Name: recipes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recipes (
    id text NOT NULL,
    menu_item_id text NOT NULL,
    ingredient_id text NOT NULL,
    quantity numeric(10,3) NOT NULL
);


ALTER TABLE public.recipes OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 36023)
-- Name: reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservations (
    id text NOT NULL,
    table_number integer NOT NULL,
    customer_name text NOT NULL,
    customer_phone text,
    date date NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    status public."ReservationStatus" DEFAULT 'pending'::public."ReservationStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.reservations OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 36056)
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id text NOT NULL,
    tax_rate numeric(5,2) DEFAULT 5.00 NOT NULL,
    currency character varying(10) DEFAULT '₹'::character varying NOT NULL,
    restaurant_name character varying(100) DEFAULT 'Restaurant'::character varying NOT NULL,
    discount_presets jsonb DEFAULT '[]'::jsonb NOT NULL,
    printer_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    business_hours jsonb,
    enabled_payment_methods text[] DEFAULT ARRAY['cash'::text, 'card'::text, 'upi'::text],
    receipt_footer text DEFAULT 'Thank you for your business!'::text NOT NULL,
    gst_no character varying(50),
    restaurant_address text,
    tax_enabled boolean DEFAULT true NOT NULL,
    notification_preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    reservation_grace_period integer DEFAULT 15 NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 36224)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    contact_name text,
    email text,
    phone text,
    address text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 35947)
-- Name: tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tables (
    id text NOT NULL,
    number integer NOT NULL,
    capacity integer NOT NULL,
    status public."TableStatus" DEFAULT 'free'::public."TableStatus" NOT NULL,
    current_order_id text,
    reserved_by character varying(100),
    reserved_time timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    group_id text,
    is_primary boolean DEFAULT false NOT NULL
);


ALTER TABLE public.tables OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 35929)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role public."UserRole" DEFAULT 'waiter'::public."UserRole" NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4962 (class 2604 OID 35992)
-- Name: orders order_number; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_number SET DEFAULT nextval('public.orders_order_number_seq'::regclass);


--
-- TOC entry 5218 (class 0 OID 36101)
-- Dependencies: 229
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, user_id, action, details, created_at) FROM stdin;
320e95a2-f171-41af-9905-dc324171bad1	ac479ba7-39b7-4add-8f70-c6a0951c3c24	RESERVATION_CREATED	Reservation created for Table 7 on 1974-01-02 at 18:36	2026-02-06 05:23:51.212
014e4b0f-268a-46f9-81fb-fe8ab964690f	ac479ba7-39b7-4add-8f70-c6a0951c3c24	RESERVATION_CREATED	Reservation created for Table 7 on 2026-02-06 at 12:00	2026-02-06 05:24:16.897
8d1fc857-ba61-4528-8b32-c3e0aba02417	ac479ba7-39b7-4add-8f70-c6a0951c3c24	RESERVATION_CANCELLED	Reservation for Table 7 cancelled by Admin	2026-02-06 05:30:55.769
ffa57d1e-8c85-48ed-8b3c-ddbdb4287d4f	ac479ba7-39b7-4add-8f70-c6a0951c3c24	RESERVATION_CREATED	Reservation created for Table 7 on 2026-02-06 at 12:00	2026-02-06 05:31:16.076
38a377e5-5bb1-434b-8694-d50eb24fe1ac	ac479ba7-39b7-4add-8f70-c6a0951c3c24	RESERVATION_CANCELLED	Reservation for Table 7 cancelled by Admin	2026-02-06 05:31:27.117
9c7bd814-29c3-40f6-812c-e412ccc615ce	ac479ba7-39b7-4add-8f70-c6a0951c3c24	RESERVATION_CREATED	Reservation created for Table 7 on 2026-02-06 at 12:00	2026-02-06 05:35:47.745
f7b21a1f-84f6-4634-939a-52b1384c2492	ac479ba7-39b7-4add-8f70-c6a0951c3c24	RESERVATION_CANCELLED	Reservation for Table 7 cancelled by Admin	2026-02-06 05:36:10.809
79bc0be1-f2e0-4bbf-8317-1b815ced033d	ac479ba7-39b7-4add-8f70-c6a0951c3c24	RESERVATION_CREATED	Reservation created for Table 10 on 2026-02-06 at 12:00	2026-02-06 05:59:53.76
defd6522-500b-42bf-9ef4-893165ab7a83	ac479ba7-39b7-4add-8f70-c6a0951c3c24	RESERVATION_CANCELLED	Reservation for Table 10 cancelled by Admin	2026-02-06 06:00:09.243
3f15a894-5ca6-433a-9e9f-fbc5170c3c7a	ac479ba7-39b7-4add-8f70-c6a0951c3c24	RESERVATION_CREATED	Reservation created for Table 11 on Mon Jul 03 2023 05:30:00 GMT+0530 (India Standard Time) at 13:37	2026-02-10 10:52:29.179
f5cd1435-d9c6-4476-9c29-8baa8f50b7a6	ac479ba7-39b7-4add-8f70-c6a0951c3c24	RESERVATION_CREATED	Reservation created for Table 11 on Wed Feb 11 2026 05:30:00 GMT+0530 (India Standard Time) at 07:55	2026-02-10 10:52:57.229
\.


--
-- TOC entry 5219 (class 0 OID 36113)
-- Dependencies: 230
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, description, is_active, created_at, updated_at) FROM stdin;
98825373-621f-40af-9ea4-7094d25c633f	Pizza	Auto-generated category for Pizza	t	2026-02-05 11:09:05.757	2026-02-05 11:09:05.757
102d7b84-d16a-4336-a378-55e6ad9ae1d6	Burgers	Auto-generated category for Burgers	t	2026-02-05 11:09:05.757	2026-02-05 11:09:05.757
7c3dc92b-779e-4ab0-a753-ebf10ffc0e7c	Salads	Auto-generated category for Salads	t	2026-02-05 11:09:05.757	2026-02-05 11:09:05.757
23de1be3-4692-40a6-a1a4-0f6f96626c38	Mains	Auto-generated category for Mains	t	2026-02-05 11:09:05.757	2026-02-05 11:09:05.757
3a7769aa-12a0-4c8d-b409-7168129dcb11	Desserts	Auto-generated category for Desserts	t	2026-02-05 11:09:05.757	2026-02-05 11:09:05.757
7b2d9cca-2d0e-4b1b-a5ac-eabf6a140e23	Beverages	Auto-generated category for Beverages	t	2026-02-05 11:09:05.757	2026-02-05 11:09:05.757
f5a018d3-4cdd-4c59-b2c2-656f0d807b08	Pasta	Auto-generated category for Pasta	t	2026-02-05 11:09:05.757	2026-02-05 11:09:05.757
\.


--
-- TOC entry 5217 (class 0 OID 36084)
-- Dependencies: 228
-- Data for Name: daily_sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_sales (id, date, total_sales, total_orders, average_order_value, created_at) FROM stdin;
b17b2d84-9713-4e48-acb2-7b746e9d7d42	2026-01-30	12890.00	35	368.00	2026-02-05 11:07:16.559
7ff36dec-5a22-4514-aa5c-db5bd756c7ef	2026-01-31	13240.00	36	368.00	2026-02-05 11:07:16.559
d88bda67-b3f9-4f95-83da-3295976eba93	2026-02-03	18230.00	51	357.00	2026-02-05 11:07:16.559
2c6a2e46-509d-403a-be2c-ddf0e86408c9	2026-02-01	14560.00	39	373.00	2026-02-05 11:07:16.559
88785ee8-e4cf-4e42-9a3d-bf33a6a3da09	2026-02-02	16890.00	48	352.00	2026-02-05 11:07:16.559
3c3aab58-ea9f-410a-a6d3-6c51df2fff5f	2026-02-04	23255.80	57	408.00	2026-02-05 11:07:16.56
cd60379d-bf1a-4f79-ae4f-9f4e795d8ca6	2026-02-05	1956.10	7	279.44	2026-02-06 04:51:56.77
5c9198a7-3927-41ba-9083-240eac6464d8	2026-02-07	16890.00	48	352.00	2026-02-10 09:17:52.332
279aee69-6d55-4b51-9709-9124e220937b	2026-02-06	14560.00	39	373.00	2026-02-10 09:17:52.331
94aa51d3-5c1e-4a43-973d-899e334371cd	2026-02-08	18230.00	51	357.00	2026-02-10 09:17:52.334
3657d6cb-64fc-4f68-873a-c92fdfe3d40d	2026-02-09	6572.00	9	730.22	2026-02-10 06:37:30.9
\.


--
-- TOC entry 5220 (class 0 OID 36127)
-- Dependencies: 231
-- Data for Name: delivery_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_details (id, order_id, customer_name, customer_phone, address, driver_id, delivery_status) FROM stdin;
\.


--
-- TOC entry 5221 (class 0 OID 36141)
-- Dependencies: 232
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingredients (id, name, unit, stock, min_level, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5222 (class 0 OID 36158)
-- Dependencies: 233
-- Data for Name: menu_item_modifiers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.menu_item_modifiers (id, menu_item_id, name, price, available) FROM stdin;
\.


--
-- TOC entry 5210 (class 0 OID 35962)
-- Dependencies: 221
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.menu_items (id, name, category, price, description, image_url, available, preparation_time, created_at, updated_at, category_id, available_from, available_to, is_veg, availability_reason) FROM stdin;
550e8400-e29b-41d4-a716-446655440000	Margherita Pizza	Pizza	299.00	Classic tomato and mozzarella	\N	t	15	2026-02-05 11:07:16.468	2026-02-06 11:22:42.088	98825373-621f-40af-9ea4-7094d25c633f	\N	\N	t	\N
550e8400-e29b-41d4-a716-446655440001	Pepperoni Pizza	Pizza	399.00	Loaded with pepperoni	\N	t	15	2026-02-05 11:07:16.469	2026-02-06 11:22:42.088	98825373-621f-40af-9ea4-7094d25c633f	\N	\N	t	\N
550e8400-e29b-41d4-a716-446655440003	Chicken Burger	Burgers	249.00	Grilled chicken with special sauce	\N	t	12	2026-02-05 11:07:16.469	2026-02-06 11:22:42.096	102d7b84-d16a-4336-a378-55e6ad9ae1d6	\N	\N	t	\N
550e8400-e29b-41d4-a716-446655440004	Veg Burger	Burgers	199.00	Veggie patty with fresh vegetables	\N	t	10	2026-02-05 11:07:16.469	2026-02-06 11:22:42.096	102d7b84-d16a-4336-a378-55e6ad9ae1d6	\N	\N	t	\N
550e8400-e29b-41d4-a716-446655440002	Caesar Salad	Salads	199.00	Fresh romaine lettuce with Caesar dressing	\N	t	10	2026-02-05 11:07:16.469	2026-02-06 11:22:42.101	7c3dc92b-779e-4ab0-a753-ebf10ffc0e7c	\N	\N	t	\N
550e8400-e29b-41d4-a716-446655440007	Fish & Chips	Mains	399.00	Crispy fried fish with fries	\N	t	15	2026-02-05 11:07:16.47	2026-02-06 11:22:42.108	23de1be3-4692-40a6-a1a4-0f6f96626c38	\N	\N	t	\N
550e8400-e29b-41d4-a716-446655440006	Grilled Chicken	Mains	449.00	Tender grilled chicken with herbs	\N	t	20	2026-02-05 11:07:16.469	2026-02-06 11:22:42.108	23de1be3-4692-40a6-a1a4-0f6f96626c38	\N	\N	t	\N
550e8400-e29b-41d4-a716-446655440008	Chocolate Brownie	Desserts	149.00	Warm chocolate brownie with ice cream	\N	t	8	2026-02-05 11:07:16.47	2026-02-06 11:22:42.113	3a7769aa-12a0-4c8d-b409-7168129dcb11	\N	\N	t	\N
550e8400-e29b-41d4-a716-446655440009	Tiramisu	Desserts	199.00	Classic Italian dessert	\N	t	5	2026-02-05 11:07:16.471	2026-02-06 11:22:42.113	3a7769aa-12a0-4c8d-b409-7168129dcb11	\N	\N	t	\N
550e8400-e29b-41d4-a716-446655440011	Fresh Orange Juice	Beverages	99.00	Freshly squeezed orange juice	\N	t	5	2026-02-05 11:07:16.476	2026-02-06 11:22:42.118	7b2d9cca-2d0e-4b1b-a5ac-eabf6a140e23	\N	\N	t	\N
550e8400-e29b-41d4-a716-446655440005	Pasta Carbonara	Pasta	349.00	Creamy pasta with bacon	\N	t	18	2026-02-05 11:07:16.47	2026-02-06 11:22:42.124	f5a018d3-4cdd-4c59-b2c2-656f0d807b08	\N	\N	t	\N
550e8400-e29b-41d4-a716-446655440010	Coke	Beverages	49.00	Chilled soft drink	\N	f	2	2026-02-05 11:07:16.476	2026-02-10 05:25:05.68	7b2d9cca-2d0e-4b1b-a5ac-eabf6a140e23	\N	\N	t	\N
\.


--
-- TOC entry 5215 (class 0 OID 36041)
-- Dependencies: 226
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, type, message, user_id, read, created_at) FROM stdin;
8bf3466f-ffea-469d-a320-0bf1fd9dd182	order	Welcome to the restaurant management system!	ac479ba7-39b7-4add-8f70-c6a0951c3c24	f	2026-02-05 11:07:16.551
a7f3db8c-3df7-46ed-8384-3ba7317027ef	alert	System initialized successfully	ac479ba7-39b7-4add-8f70-c6a0951c3c24	t	2026-02-05 11:07:16.551
b648adfd-6d24-4eb0-890e-31a6b8364eaf	order	Welcome to the restaurant management system!	ac479ba7-39b7-4add-8f70-c6a0951c3c24	f	2026-02-10 09:17:52.311
869f369a-e8b7-4867-88c0-868902a8ae8a	alert	System initialized successfully	ac479ba7-39b7-4add-8f70-c6a0951c3c24	t	2026-02-10 09:17:52.313
\.


--
-- TOC entry 5213 (class 0 OID 36006)
-- Dependencies: 224
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, menu_item_id, quantity, notes, status, created_at, updated_at, modifiers) FROM stdin;
edfc4e5a-9c4c-486d-9489-3b6577d56573	42aaca50-0c4d-49f3-904e-ecb53c7a6658	550e8400-e29b-41d4-a716-446655440009	1	\N	served	2026-01-30 06:57:16.567	2026-01-30 06:57:16.567	[]
54e82a1a-1374-40d6-8736-4cebc9144796	42aaca50-0c4d-49f3-904e-ecb53c7a6658	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-01-30 06:57:16.567	2026-01-30 06:57:16.567	[]
bf571148-b72f-4cbf-80bf-633d02c5df84	42aaca50-0c4d-49f3-904e-ecb53c7a6658	550e8400-e29b-41d4-a716-446655440011	1	\N	served	2026-01-30 06:57:16.567	2026-01-30 06:57:16.567	[]
94a44584-6298-44c4-b3d4-f2fdffa7085e	42aaca50-0c4d-49f3-904e-ecb53c7a6658	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-01-30 06:57:16.567	2026-01-30 06:57:16.567	[]
f5678e4c-570c-46e8-b3e6-31b623ca5632	083c317a-b47e-45bf-8153-c908acfe9ea9	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-01-31 07:18:16.583	2026-01-31 07:18:16.583	[]
45eac4a6-ebe3-4913-a54e-a40129527493	083c317a-b47e-45bf-8153-c908acfe9ea9	550e8400-e29b-41d4-a716-446655440007	1	\N	served	2026-01-31 07:18:16.583	2026-01-31 07:18:16.583	[]
8c6a5656-0d18-45e5-a602-6b024bd5f358	083c317a-b47e-45bf-8153-c908acfe9ea9	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-01-31 07:18:16.583	2026-01-31 07:18:16.583	[]
73c0c3da-2c32-4d18-a4b1-d952dc5b99d0	042b6a8a-37c4-473f-bdb8-df654a91e9d5	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-02-02 10:47:16.592	2026-02-02 10:47:16.592	[]
41ed90c0-9235-4f38-b835-1c6cfea8a59f	042b6a8a-37c4-473f-bdb8-df654a91e9d5	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-02 10:47:16.592	2026-02-02 10:47:16.592	[]
805f8410-36d1-431b-a70e-8b23ff007ae9	58fe319d-918a-4552-aaac-17616560d197	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-02 13:16:16.6	2026-02-02 13:16:16.6	[]
c885a1a8-9aad-401c-af96-d423894b184b	58fe319d-918a-4552-aaac-17616560d197	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-02 13:16:16.6	2026-02-02 13:16:16.6	[]
8f0272d0-872b-4f9b-847d-0260e169a318	58fe319d-918a-4552-aaac-17616560d197	550e8400-e29b-41d4-a716-446655440010	1	\N	served	2026-02-02 13:16:16.6	2026-02-02 13:16:16.6	[]
a7383bb5-92bf-4cf3-9143-836397b78432	58fe319d-918a-4552-aaac-17616560d197	550e8400-e29b-41d4-a716-446655440001	1	\N	served	2026-02-02 13:16:16.6	2026-02-02 13:16:16.6	[]
efb9152a-8859-4787-b456-69e818599e3c	4f5696b4-8ffe-43fb-8c90-510010068363	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-03 10:38:16.608	2026-02-03 10:38:16.608	[]
430a28f5-a531-450e-9d65-3efb7e761064	4f5696b4-8ffe-43fb-8c90-510010068363	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-03 10:38:16.608	2026-02-03 10:38:16.608	[]
76970590-ffa5-493e-a727-740cfd0c0dcc	4f5696b4-8ffe-43fb-8c90-510010068363	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-03 10:38:16.608	2026-02-03 10:38:16.608	[]
fad4eb68-0ce1-48d2-aadb-44dc84f1b224	4f5696b4-8ffe-43fb-8c90-510010068363	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-02-03 10:38:16.608	2026-02-03 10:38:16.608	[]
10f1be5c-47d3-4373-a90a-11984c083100	9370bab0-d0d2-4f19-98c0-4e88207f0aa5	550e8400-e29b-41d4-a716-446655440001	1	\N	served	2026-02-05 10:44:16.622	2026-02-05 10:44:16.622	[]
c6d56f1a-bb27-424c-9fd6-39ddf07e3ce1	9370bab0-d0d2-4f19-98c0-4e88207f0aa5	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-05 10:44:16.622	2026-02-05 10:44:16.622	[]
11d7fa35-f84c-44dd-b1ec-ed34d67962bb	9370bab0-d0d2-4f19-98c0-4e88207f0aa5	550e8400-e29b-41d4-a716-446655440009	1	\N	served	2026-02-05 10:44:16.622	2026-02-05 10:44:16.622	[]
395e8420-069c-4f0b-98e2-fce655bdbfd1	9370bab0-d0d2-4f19-98c0-4e88207f0aa5	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-05 10:44:16.622	2026-02-05 10:44:16.622	[]
58076779-07e7-4ec3-b8e1-a2065480fa19	a30db5b0-51b4-4634-95fc-99d8d31318a3	550e8400-e29b-41d4-a716-446655440009	1	\N	served	2026-02-04 13:27:16.631	2026-02-04 13:27:16.631	[]
fdb4ce9f-3416-4e47-8cf4-f6db44a9fe93	a30db5b0-51b4-4634-95fc-99d8d31318a3	550e8400-e29b-41d4-a716-446655440007	1	\N	served	2026-02-04 13:27:16.631	2026-02-04 13:27:16.631	[]
b49607bc-bff0-4f0f-8e7e-01c3d1cc87b9	6167734a-8241-4e57-aca5-70cd4716c238	550e8400-e29b-41d4-a716-446655440011	1	\N	served	2026-02-01 08:12:16.64	2026-02-01 08:12:16.64	[]
1d96421b-767a-4b70-9ea7-26b70cd9a9b7	6167734a-8241-4e57-aca5-70cd4716c238	550e8400-e29b-41d4-a716-446655440007	1	\N	served	2026-02-01 08:12:16.64	2026-02-01 08:12:16.64	[]
25150c45-8b5f-4e58-924c-52c28a0b7150	ee915e42-ce31-4edd-8ec7-636d7cd95b3b	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-02-05 11:20:16.647	2026-02-05 11:20:16.647	[]
fc1be56b-0892-4454-910f-94de1a5774f0	ee915e42-ce31-4edd-8ec7-636d7cd95b3b	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-05 11:20:16.647	2026-02-05 11:20:16.647	[]
4a47913d-71c2-4832-acb9-5cd0b132b82e	ee915e42-ce31-4edd-8ec7-636d7cd95b3b	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-02-05 11:20:16.647	2026-02-05 11:20:16.647	[]
1403ad8a-60a7-4b74-be71-e5f58286cd6d	06a233ed-0650-4b0c-829c-4d7eb2042b62	550e8400-e29b-41d4-a716-446655440010	1	\N	served	2026-02-03 11:16:16.656	2026-02-03 11:16:16.656	[]
2c601be3-221a-45ec-89f2-ecf2f3ec9663	06a233ed-0650-4b0c-829c-4d7eb2042b62	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-03 11:16:16.656	2026-02-03 11:16:16.656	[]
4aea7850-bc2e-414b-af0b-50ccb6a25e15	06a233ed-0650-4b0c-829c-4d7eb2042b62	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-03 11:16:16.656	2026-02-03 11:16:16.656	[]
14d9ddd6-c8df-4ddf-966b-dcaf5c39be06	06a233ed-0650-4b0c-829c-4d7eb2042b62	550e8400-e29b-41d4-a716-446655440007	1	\N	served	2026-02-03 11:16:16.656	2026-02-03 11:16:16.656	[]
1957c5e3-72b7-491e-a937-473060c3eba8	51209753-f7f5-4ec7-873d-9cdee16335fa	550e8400-e29b-41d4-a716-446655440007	1	\N	served	2026-01-31 07:23:16.664	2026-01-31 07:23:16.664	[]
e5d691c1-522f-4991-89ab-2a5d3e08597f	51209753-f7f5-4ec7-873d-9cdee16335fa	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-01-31 07:23:16.664	2026-01-31 07:23:16.664	[]
44c1e2f6-364e-449c-9daa-261d96448803	51209753-f7f5-4ec7-873d-9cdee16335fa	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-01-31 07:23:16.664	2026-01-31 07:23:16.664	[]
a4534231-c8cd-4139-ba9d-d0b2cbfba1df	d9974a8a-a71a-4162-b663-d6d983775ac0	550e8400-e29b-41d4-a716-446655440007	1	\N	served	2026-02-01 11:52:16.672	2026-02-01 11:52:16.672	[]
d4ab2e1f-e262-4fbc-adcd-d7e171a93fb0	d9974a8a-a71a-4162-b663-d6d983775ac0	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-01 11:52:16.672	2026-02-01 11:52:16.672	[]
efc852ab-b4b6-447e-82c9-5aaea2df6141	d9974a8a-a71a-4162-b663-d6d983775ac0	550e8400-e29b-41d4-a716-446655440010	1	\N	served	2026-02-01 11:52:16.672	2026-02-01 11:52:16.672	[]
a5ae98bc-05e5-4668-bec8-a2ab07e936ad	d9974a8a-a71a-4162-b663-d6d983775ac0	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-01 11:52:16.672	2026-02-01 11:52:16.672	[]
d43392d5-cb7a-40e5-87ec-63916f1f33e0	fbf8d683-82c4-4116-a242-eea50cba4ef0	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-01-31 06:41:16.68	2026-01-31 06:41:16.68	[]
5698afbd-87fd-4847-ab63-f18ffbff3a80	fbf8d683-82c4-4116-a242-eea50cba4ef0	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-01-31 06:41:16.68	2026-01-31 06:41:16.68	[]
82d65b9a-28d9-41ca-83da-d12e19a44545	94606b1a-62d8-4dac-ac4d-d2323f38442e	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-01 11:57:16.688	2026-02-01 11:57:16.688	[]
98243e17-fa94-4e12-91cf-9d407b08c316	94606b1a-62d8-4dac-ac4d-d2323f38442e	550e8400-e29b-41d4-a716-446655440001	1	\N	served	2026-02-01 11:57:16.688	2026-02-01 11:57:16.688	[]
91007e2a-c267-4ac4-b0f8-10a855835e8b	94606b1a-62d8-4dac-ac4d-d2323f38442e	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-01 11:57:16.688	2026-02-01 11:57:16.688	[]
75765ad8-e51f-40a5-a140-a3ae7556355a	29844479-103a-4f0e-857e-83c3b4703977	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-01-30 10:42:16.696	2026-01-30 10:42:16.696	[]
9eee96e9-cf5a-433a-ba40-30ac3269e4b4	29844479-103a-4f0e-857e-83c3b4703977	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-01-30 10:42:16.696	2026-01-30 10:42:16.696	[]
070ce818-5dd7-49e4-a496-1df78cbb88a1	29844479-103a-4f0e-857e-83c3b4703977	550e8400-e29b-41d4-a716-446655440010	1	\N	served	2026-01-30 10:42:16.696	2026-01-30 10:42:16.696	[]
259caa39-b330-4b3f-91aa-fa1e48bf4f00	29844479-103a-4f0e-857e-83c3b4703977	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-01-30 10:42:16.696	2026-01-30 10:42:16.696	[]
ada06451-c1b8-4a21-a476-6cad1a66e3e2	d45103d9-2fd7-4220-adcf-66552a22dff9	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-01-30 06:46:16.705	2026-01-30 06:46:16.705	[]
4e6a77ce-8a1d-4346-b99f-ab9e77744144	d45103d9-2fd7-4220-adcf-66552a22dff9	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-01-30 06:46:16.705	2026-01-30 06:46:16.705	[]
369c722b-73c0-4f5f-b1e9-7f0da62c0305	d45103d9-2fd7-4220-adcf-66552a22dff9	550e8400-e29b-41d4-a716-446655440011	1	\N	served	2026-01-30 06:46:16.705	2026-01-30 06:46:16.705	[]
2ab10a1c-95b1-4090-8829-f00b1baec674	d45103d9-2fd7-4220-adcf-66552a22dff9	550e8400-e29b-41d4-a716-446655440007	1	\N	served	2026-01-30 06:46:16.705	2026-01-30 06:46:16.705	[]
59db5c37-a8be-4aa1-ad74-e0b6105e4768	5cdaca29-f1e1-4899-a56e-f78a3749e385	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-02-01 07:17:16.713	2026-02-01 07:17:16.713	[]
c17d5a23-ed0e-4a85-afb7-7cca5a3d47f6	5cdaca29-f1e1-4899-a56e-f78a3749e385	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-01 07:17:16.713	2026-02-01 07:17:16.713	[]
d7f0b074-befa-4412-b558-8aa5e49dd706	5cdaca29-f1e1-4899-a56e-f78a3749e385	550e8400-e29b-41d4-a716-446655440001	1	\N	served	2026-02-01 07:17:16.713	2026-02-01 07:17:16.713	[]
4fa5cb35-5185-4149-a885-0977cc00f546	5cdaca29-f1e1-4899-a56e-f78a3749e385	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-01 07:17:16.713	2026-02-01 07:17:16.713	[]
4467148b-0b65-4dec-9c66-e56e08c81b50	d8b8c2a4-1832-4ad9-bb7b-d88364fea295	550e8400-e29b-41d4-a716-446655440010	1	\N	served	2026-02-05 11:23:16.723	2026-02-05 11:23:16.723	[]
73dea2d2-7fe6-4d24-842b-c0b6c0acd607	d8b8c2a4-1832-4ad9-bb7b-d88364fea295	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-02-05 11:23:16.723	2026-02-05 11:23:16.723	[]
2e6cee76-1546-4c37-ac04-e04513903607	825bfbbe-76e6-4968-9d6a-10546c1687c2	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-04 12:49:16.732	2026-02-04 12:49:16.732	[]
52142187-1c4e-4175-9f07-3ee09da05cd7	825bfbbe-76e6-4968-9d6a-10546c1687c2	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-04 12:49:16.732	2026-02-04 12:49:16.732	[]
d88261b1-7f05-48ab-8346-170339861fae	006a9bef-7c38-4391-954e-07c105cadd39	550e8400-e29b-41d4-a716-446655440009	1	\N	served	2026-02-03 07:44:16.741	2026-02-03 07:44:16.741	[]
38d0442a-6f5b-4990-8aaa-58cabe77b293	006a9bef-7c38-4391-954e-07c105cadd39	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-03 07:44:16.741	2026-02-03 07:44:16.741	[]
605a0975-0a87-4a8a-bd4a-593c6c343ea9	2fc63386-3463-456a-bf46-d0384986ce35	550e8400-e29b-41d4-a716-446655440003	1		served	2026-02-05 11:14:05.169	2026-02-05 11:14:28.341	[]
5a687edf-aa3b-450e-81cb-bd673b16c03c	2fc63386-3463-456a-bf46-d0384986ce35	550e8400-e29b-41d4-a716-446655440008	1		served	2026-02-05 11:14:05.169	2026-02-05 11:14:28.341	[]
4307c6ae-6c95-4485-9c24-1ff4edb71cbc	da2e1cf6-1632-4c22-9359-90ad4549f7c4	550e8400-e29b-41d4-a716-446655440003	1		served	2026-02-05 11:09:25.656	2026-02-05 11:12:34.796	[]
f9d8592f-d512-4355-8647-388421987865	da2e1cf6-1632-4c22-9359-90ad4549f7c4	550e8400-e29b-41d4-a716-446655440002	1		served	2026-02-05 11:09:25.656	2026-02-05 11:12:34.796	[]
a9c0aded-cc6e-40e3-9144-503ee7e04175	2fc63386-3463-456a-bf46-d0384986ce35	550e8400-e29b-41d4-a716-446655440002	1		served	2026-02-05 11:14:05.169	2026-02-05 11:14:28.341	[]
36bb9468-2b96-45c0-9b63-4c07366d98dd	2aa72427-9472-4a26-9fcf-d46db9fe426c	550e8400-e29b-41d4-a716-446655440003	1		ready	2026-02-05 11:12:47.273	2026-02-05 11:13:25.709	[]
7f586c68-91d1-4015-8a22-36be47283e99	2aa72427-9472-4a26-9fcf-d46db9fe426c	550e8400-e29b-41d4-a716-446655440000	1		ready	2026-02-05 11:12:47.273	2026-02-05 11:13:25.91	[]
3b90df88-6da1-4267-a18d-f7396ecc1ae8	2aa72427-9472-4a26-9fcf-d46db9fe426c	550e8400-e29b-41d4-a716-446655440004	1		ready	2026-02-05 11:12:47.273	2026-02-05 11:13:26.343	[]
c8df398f-b8ee-4720-9645-53f95783ef13	e8c8724f-c87e-4d94-b6ef-30497ae0aea2	550e8400-e29b-41d4-a716-446655440002	1		served	2026-02-05 11:30:51.814	2026-02-05 11:31:04.479	[]
bc22414d-cae6-4406-afc9-8ec72de33d21	e8c8724f-c87e-4d94-b6ef-30497ae0aea2	550e8400-e29b-41d4-a716-446655440003	1		served	2026-02-05 11:30:51.814	2026-02-05 11:31:04.479	[]
940e20d1-a84d-4ed9-aced-aae8301f8a34	e8c8724f-c87e-4d94-b6ef-30497ae0aea2	550e8400-e29b-41d4-a716-446655440008	1		served	2026-02-05 11:30:51.814	2026-02-05 11:31:04.479	[]
772e3b61-c8c9-4228-b2ad-50da2c33a4c1	2b7fd5a6-4b90-40e5-b7c1-4cd6d7b3c85c	550e8400-e29b-41d4-a716-446655440007	1		served	2026-02-05 11:20:29.758	2026-02-05 11:21:08.529	[]
1f30c74d-e3b5-4604-9320-a7a16490336c	b1ebdfe9-0d07-420b-8bc7-dcd3ba298ffb	550e8400-e29b-41d4-a716-446655440004	1		served	2026-02-05 11:31:23.57	2026-02-05 11:31:49.797	[]
9c6351c2-7c3c-48b5-9fcf-e182cd53d9b7	b1ebdfe9-0d07-420b-8bc7-dcd3ba298ffb	550e8400-e29b-41d4-a716-446655440000	1		served	2026-02-05 11:31:23.57	2026-02-05 11:31:49.797	[]
8e30ce0e-22ec-4e28-a36b-e9693373e049	b1ebdfe9-0d07-420b-8bc7-dcd3ba298ffb	550e8400-e29b-41d4-a716-446655440009	1		served	2026-02-05 11:31:23.57	2026-02-05 11:31:49.797	[]
197f836f-716c-4121-9b44-7abaac8f6b59	60da06ed-b2a3-4d2b-b61a-24bd89933cfd	550e8400-e29b-41d4-a716-446655440005	1		served	2026-02-05 11:40:35.156	2026-02-05 11:40:45.052	[]
c576912a-f24a-4e4e-9968-fda091dcaec3	65e80f75-9987-4717-9bb7-fd873d38419d	550e8400-e29b-41d4-a716-446655440008	1		served	2026-02-05 11:38:47.073	2026-02-05 11:39:38.657	[]
2f76f8e9-9e16-43ae-89f0-4d3bf07e5855	65e80f75-9987-4717-9bb7-fd873d38419d	550e8400-e29b-41d4-a716-446655440008	1		served	2026-02-05 11:39:22.843	2026-02-05 11:39:38.657	[]
6c1a252e-d202-47e6-9ffe-0626553e8519	65e80f75-9987-4717-9bb7-fd873d38419d	550e8400-e29b-41d4-a716-446655440003	1		served	2026-02-05 11:38:47.073	2026-02-05 11:39:38.657	[]
1bbf6e62-3135-4e6b-8ef7-c0265eacf4d5	65e80f75-9987-4717-9bb7-fd873d38419d	550e8400-e29b-41d4-a716-446655440003	1		served	2026-02-05 11:39:22.843	2026-02-05 11:39:38.657	[]
a2820cc5-375f-4df2-a465-3394c764c488	60da06ed-b2a3-4d2b-b61a-24bd89933cfd	550e8400-e29b-41d4-a716-446655440004	1		served	2026-02-05 11:40:35.156	2026-02-05 11:40:45.052	[]
c9867880-dbad-476a-9d02-ee6187746d43	65e80f75-9987-4717-9bb7-fd873d38419d	550e8400-e29b-41d4-a716-446655440010	1		served	2026-02-05 11:39:22.843	2026-02-05 11:39:38.657	[]
f14d439d-ee37-4c19-b228-f49fdc2e7fdb	65e80f75-9987-4717-9bb7-fd873d38419d	550e8400-e29b-41d4-a716-446655440002	1		served	2026-02-05 11:38:47.073	2026-02-05 11:39:38.657	[]
ce82d3b8-173f-4461-a7a5-06bc42a6e34c	e30ebe8b-b082-41ca-9cea-b17f38bd117c	550e8400-e29b-41d4-a716-446655440001	1		ready	2026-02-05 11:58:42.762	2026-02-05 12:06:22.882	[]
9fa96b54-52e9-4e54-afe2-2e4a80585748	36fa86f1-d3a0-4c4a-86ba-abbfb9a1e88e	550e8400-e29b-41d4-a716-446655440002	1		served	2026-02-06 04:51:23.305	2026-02-06 04:51:47.174	[]
207a1dc1-6ff4-4903-b9ab-2db76a023c17	36fa86f1-d3a0-4c4a-86ba-abbfb9a1e88e	550e8400-e29b-41d4-a716-446655440003	1		served	2026-02-06 04:51:23.305	2026-02-06 04:51:47.174	[]
8a7e77d1-e4de-46b1-94ab-99edd212bf60	cb5d1652-7062-47f1-a14a-65610627f9ff	550e8400-e29b-41d4-a716-446655440002	1		served	2026-02-05 12:06:12.119	2026-02-05 12:06:38.089	[]
deea222d-9023-4537-85c4-a74440c277a4	77a72c34-e208-40a1-a392-f495d01820d7	550e8400-e29b-41d4-a716-446655440002	1		served	2026-02-05 11:40:15.026	2026-02-05 11:40:22.532	[]
805e1647-2ec5-485b-93e9-837bba97056b	77a72c34-e208-40a1-a392-f495d01820d7	550e8400-e29b-41d4-a716-446655440003	1		served	2026-02-05 11:40:15.026	2026-02-05 11:40:22.532	[]
f13b2fae-749c-4938-9165-99eee0a9a730	36fa86f1-d3a0-4c4a-86ba-abbfb9a1e88e	550e8400-e29b-41d4-a716-446655440011	1		served	2026-02-06 04:51:23.305	2026-02-06 04:51:47.174	[]
2f2788ec-c350-4a0f-a130-66d495c2f1c6	f664aafd-3cf5-477e-8d7d-539ffb61056e	550e8400-e29b-41d4-a716-446655440009	1		served	2026-02-05 12:06:51.232	2026-02-05 12:07:03.03	[]
d114b03c-958f-4a47-ba0b-e2e9478faeaa	cccac53e-63b1-4e46-892e-d9db896c7a4b	550e8400-e29b-41d4-a716-446655440003	1		served	2026-02-05 11:47:45.475	2026-02-05 11:48:02.693	[]
06b43f46-8f1f-4afa-8680-9a9387ffbc0e	cccac53e-63b1-4e46-892e-d9db896c7a4b	550e8400-e29b-41d4-a716-446655440002	1		served	2026-02-05 11:47:45.475	2026-02-05 11:48:02.693	[]
af02334b-b05a-42ba-a4b1-a4aaae066a98	cccac53e-63b1-4e46-892e-d9db896c7a4b	550e8400-e29b-41d4-a716-446655440011	1		served	2026-02-05 11:47:45.475	2026-02-05 11:48:02.693	[]
fd1c0848-2d54-4494-9e7e-9f8ca44d47ca	f875e81d-d595-49a0-919d-ad10b6577fc7	550e8400-e29b-41d4-a716-446655440010	1		served	2026-02-05 12:16:10.735	2026-02-05 12:16:31.655	[]
b5791041-05b2-49c7-924b-c216bee9e4b8	d06e7f49-8ab9-465e-b7a7-b719369cf076	550e8400-e29b-41d4-a716-446655440011	1		served	2026-02-06 04:54:22.168	2026-02-06 04:54:42.943	[]
1cbca939-d11f-42cc-8632-02644372e229	ca4133f1-b492-471b-86b2-9620c01362ce	550e8400-e29b-41d4-a716-446655440010	1		ready	2026-02-05 12:05:38.902	2026-02-05 12:06:19.678	[]
1cbb2202-1eda-4ad9-83fa-5ad8250cb471	ca4133f1-b492-471b-86b2-9620c01362ce	550e8400-e29b-41d4-a716-446655440011	1		ready	2026-02-05 12:05:38.902	2026-02-05 12:06:20.013	[]
892f0c08-a350-414f-bee5-74944e9a2829	ca4133f1-b492-471b-86b2-9620c01362ce	550e8400-e29b-41d4-a716-446655440001	1		ready	2026-02-05 12:05:38.902	2026-02-05 12:06:20.641	[]
bb067064-24ca-4878-acc5-3d7c13489ed3	499eece0-600f-4efc-a9a6-9b5647c9749e	550e8400-e29b-41d4-a716-446655440010	1	\N	served	2026-02-06 11:07:20.508	2026-02-06 11:07:41.901	[]
4d7b75b7-ebce-4326-b2e8-e2035dd74c60	e30ebe8b-b082-41ca-9cea-b17f38bd117c	550e8400-e29b-41d4-a716-446655440010	1		ready	2026-02-05 11:58:42.762	2026-02-05 12:06:22.219	[]
cc19156c-efef-44e5-9c30-f28b74b33d4b	e30ebe8b-b082-41ca-9cea-b17f38bd117c	550e8400-e29b-41d4-a716-446655440011	1		ready	2026-02-05 11:58:42.762	2026-02-05 12:06:22.65	[]
cac27da4-ad09-4e99-8976-3a8ae679cf18	03daaab1-f9b2-42c5-b719-2ce227403899	550e8400-e29b-41d4-a716-446655440001	1		served	2026-02-05 12:16:46.846	2026-02-05 12:16:54.751	[]
8d982125-0424-4369-828c-8c3439c8167e	ee2e64d0-deed-4091-9da5-5ded9a3e9202	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-06 11:12:44.102	2026-02-06 11:13:00.083	[]
7acf0c65-f41d-4c09-b208-f53204b8f03c	5cef9940-f827-445e-b125-93ff75f8e0a8	550e8400-e29b-41d4-a716-446655440002	1		served	2026-02-06 07:11:51.907	2026-02-06 07:12:25.518	[]
c8cbc52e-e493-4755-8bea-db8f73f67cb6	5cef9940-f827-445e-b125-93ff75f8e0a8	550e8400-e29b-41d4-a716-446655440003	1		served	2026-02-06 07:11:51.907	2026-02-06 07:12:25.518	[]
5e622295-f541-4c67-b774-2414d22d2066	ee2e64d0-deed-4091-9da5-5ded9a3e9202	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-02-06 11:12:44.102	2026-02-06 11:13:00.083	[]
c623d4be-6449-4bb5-ac87-d2e164f4dfd0	09a3f462-80d9-4fae-ad88-39ba3152188c	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-06 11:04:08.06	2026-02-06 11:04:22.6	[]
4b1e496a-076d-4ec3-879b-678e034d6e80	be05ab02-c88d-4946-9594-2dd06e179ae3	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-10 06:37:09.331	2026-02-10 06:37:25.706	[]
88edce83-7fe7-4a39-91e1-2e80f2e5c520	58b0300d-9225-49e2-961b-04e199f855ff	550e8400-e29b-41d4-a716-446655440008	1	\N	ready	2026-02-06 11:13:16.23	2026-02-06 11:17:24.744	[]
d1f1c54b-942b-404b-99dc-148f0511513d	be05ab02-c88d-4946-9594-2dd06e179ae3	550e8400-e29b-41d4-a716-446655440006	1	\N	served	2026-02-10 06:37:09.331	2026-02-10 06:37:25.706	[]
990d2126-e3bc-4e5f-8a04-72a6129fb3ac	be05ab02-c88d-4946-9594-2dd06e179ae3	550e8400-e29b-41d4-a716-446655440009	1	\N	served	2026-02-10 06:37:09.331	2026-02-10 06:37:25.706	[]
4b1f1d56-f722-4b55-be2b-032c04940115	46e08d26-ceaa-4f4b-8f70-1e3c9b6591df	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-08 10:15:52.357	2026-02-08 10:15:52.357	[]
3ea64721-a9d6-46fa-a271-8b3e8f0797ad	46e08d26-ceaa-4f4b-8f70-1e3c9b6591df	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-08 10:15:52.357	2026-02-08 10:15:52.357	[]
0f419272-fb68-4724-a248-f8c7c9e0a2fb	46e08d26-ceaa-4f4b-8f70-1e3c9b6591df	550e8400-e29b-41d4-a716-446655440001	1	\N	served	2026-02-08 10:15:52.357	2026-02-08 10:15:52.357	[]
d5744363-4f5a-4f35-b96d-2a6c6fe8f9e9	0cd8c16b-b433-4637-bc45-b7190f524c0a	550e8400-e29b-41d4-a716-446655440010	1	\N	served	2026-02-08 13:55:52.42	2026-02-08 13:55:52.42	[]
078f2436-1d98-47c2-bccc-7f0c7b2557f9	0cd8c16b-b433-4637-bc45-b7190f524c0a	550e8400-e29b-41d4-a716-446655440007	1	\N	served	2026-02-08 13:55:52.42	2026-02-08 13:55:52.42	[]
2a55dceb-00d8-4ace-b334-3bdc415fc9fc	1e7fb7ff-bbb3-4fa4-a1b1-87a12beb80d3	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-02-07 09:01:52.429	2026-02-07 09:01:52.429	[]
4edea324-9725-447d-915a-fb8c9099b365	1e7fb7ff-bbb3-4fa4-a1b1-87a12beb80d3	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-07 09:01:52.429	2026-02-07 09:01:52.429	[]
9a77ae32-2b68-49f7-ad3c-1e984808202c	1e7fb7ff-bbb3-4fa4-a1b1-87a12beb80d3	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-02-07 09:01:52.429	2026-02-07 09:01:52.429	[]
1a288ead-2b09-4b0b-98f8-92892a426fee	1e7fb7ff-bbb3-4fa4-a1b1-87a12beb80d3	550e8400-e29b-41d4-a716-446655440009	1	\N	served	2026-02-07 09:01:52.429	2026-02-07 09:01:52.429	[]
fd307fc0-bb01-4c70-bc23-125125662cdc	405617f5-6638-4e88-8e4d-5440b8ac61e2	550e8400-e29b-41d4-a716-446655440006	1	\N	served	2026-02-04 06:55:52.438	2026-02-04 06:55:52.438	[]
b19de97a-975f-42ca-bc1b-4a9e6c7b0b40	405617f5-6638-4e88-8e4d-5440b8ac61e2	550e8400-e29b-41d4-a716-446655440009	1	\N	served	2026-02-04 06:55:52.438	2026-02-04 06:55:52.438	[]
c991e151-32e5-4ff3-a510-96f8f3a7f01b	405617f5-6638-4e88-8e4d-5440b8ac61e2	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-04 06:55:52.438	2026-02-04 06:55:52.438	[]
8e8ea641-7db8-4441-af87-561a169e96fb	8d9a2cb4-a7ec-4b85-9e89-0fd0a7dd7446	550e8400-e29b-41d4-a716-446655440007	1	\N	served	2026-02-07 12:38:52.446	2026-02-07 12:38:52.446	[]
012923bb-7a53-4147-a786-ea87f3083b48	8d9a2cb4-a7ec-4b85-9e89-0fd0a7dd7446	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-07 12:38:52.446	2026-02-07 12:38:52.446	[]
8c2f713d-88f1-486f-b69f-7f13df6dfa75	8d9a2cb4-a7ec-4b85-9e89-0fd0a7dd7446	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-07 12:38:52.446	2026-02-07 12:38:52.446	[]
6b5543e8-ad19-44d6-b5f9-9d22b67e631d	8d9a2cb4-a7ec-4b85-9e89-0fd0a7dd7446	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-02-07 12:38:52.446	2026-02-07 12:38:52.446	[]
05d01814-c0b9-45b5-ba09-2143a810517b	93a3b281-59e8-4603-8ec1-3a7d51d794c1	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-08 07:47:52.457	2026-02-08 07:47:52.457	[]
c39ff49f-3c6b-432a-bc24-8f06817fb238	93a3b281-59e8-4603-8ec1-3a7d51d794c1	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-08 07:47:52.457	2026-02-08 07:47:52.457	[]
ea0a4953-fa4c-45ff-8c95-b1ddbed05e75	0e90f75d-c597-458b-97ce-40f1c9b07c40	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-09 08:45:52.466	2026-02-09 08:45:52.466	[]
887cd929-acfb-4200-b051-a0c8245d0aa3	0e90f75d-c597-458b-97ce-40f1c9b07c40	550e8400-e29b-41d4-a716-446655440009	1	\N	served	2026-02-09 08:45:52.466	2026-02-09 08:45:52.466	[]
497e15e6-2bc4-4d74-8573-e0407af7a1fb	0e90f75d-c597-458b-97ce-40f1c9b07c40	550e8400-e29b-41d4-a716-446655440001	1	\N	served	2026-02-09 08:45:52.466	2026-02-09 08:45:52.466	[]
4e5c34c5-ae8d-465b-9d57-629aa7f1549a	0e90f75d-c597-458b-97ce-40f1c9b07c40	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-09 08:45:52.466	2026-02-09 08:45:52.466	[]
51f7bc81-aa7a-4449-b306-12f878d72c1b	fcec4231-7525-4787-960e-d24973dfd460	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-09 08:35:52.478	2026-02-09 08:35:52.478	[]
a3e16eb9-7cba-4a5a-8057-7024de770095	fcec4231-7525-4787-960e-d24973dfd460	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-02-09 08:35:52.478	2026-02-09 08:35:52.478	[]
59f929ae-5877-474a-adda-0881be303f44	fcec4231-7525-4787-960e-d24973dfd460	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-02-09 08:35:52.478	2026-02-09 08:35:52.478	[]
85789fa3-51e3-4e07-b270-cd8e304b392d	fcec4231-7525-4787-960e-d24973dfd460	550e8400-e29b-41d4-a716-446655440010	1	\N	served	2026-02-09 08:35:52.478	2026-02-09 08:35:52.478	[]
eef3c3b3-5eee-4ff1-91de-2578627ba3d8	51c3e194-6576-4340-bbb1-f5a1537e126a	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-10 11:52:52.491	2026-02-10 11:52:52.491	[]
0ef39b4a-c933-4ba9-81d4-8938566ee6c1	51c3e194-6576-4340-bbb1-f5a1537e126a	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-02-10 11:52:52.491	2026-02-10 11:52:52.491	[]
5c87c1a6-3232-4031-8f59-e8aa78c6f6f4	51c3e194-6576-4340-bbb1-f5a1537e126a	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-10 11:52:52.491	2026-02-10 11:52:52.491	[]
aeb725be-a194-4513-b140-804f5e899e66	51c3e194-6576-4340-bbb1-f5a1537e126a	550e8400-e29b-41d4-a716-446655440006	1	\N	served	2026-02-10 11:52:52.491	2026-02-10 11:52:52.491	[]
e032bade-358c-498e-b7dc-3b17fccf3de2	4dd32edc-063f-4e05-a832-93c6335a72a2	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-05 07:01:52.504	2026-02-05 07:01:52.504	[]
d6abfb85-65a2-437f-9857-7bd35ba07b8d	4dd32edc-063f-4e05-a832-93c6335a72a2	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-05 07:01:52.504	2026-02-05 07:01:52.504	[]
36960b83-203a-42e1-b9e4-85a74931bde3	4dd32edc-063f-4e05-a832-93c6335a72a2	550e8400-e29b-41d4-a716-446655440009	1	\N	served	2026-02-05 07:01:52.504	2026-02-05 07:01:52.504	[]
ee235aa6-7b36-412d-aa35-2fd0a2d3d463	4dd32edc-063f-4e05-a832-93c6335a72a2	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-02-05 07:01:52.504	2026-02-05 07:01:52.504	[]
7a071a08-eea8-47fb-9037-760de6be778a	875f272b-b8d1-4a8e-9ab2-1e2b9eb71f12	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-04 11:50:52.518	2026-02-04 11:50:52.518	[]
1faf073d-3fb3-4a79-ba16-05ebff1b1202	875f272b-b8d1-4a8e-9ab2-1e2b9eb71f12	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-02-04 11:50:52.518	2026-02-04 11:50:52.518	[]
0f709795-0ec0-4773-a190-7c80a04a77fe	e33750fc-9e30-4e35-a3e8-3e90c985dd92	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-07 12:38:52.53	2026-02-07 12:38:52.53	[]
3520b493-798b-4297-be5c-2f8b69f8c595	e33750fc-9e30-4e35-a3e8-3e90c985dd92	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-02-07 12:38:52.53	2026-02-07 12:38:52.53	[]
4b303729-c796-4dc4-9f17-7b7bbec0d72b	e33750fc-9e30-4e35-a3e8-3e90c985dd92	550e8400-e29b-41d4-a716-446655440011	1	\N	served	2026-02-07 12:38:52.53	2026-02-07 12:38:52.53	[]
6efe1185-6316-4ee1-81db-5c60e53d1c85	a327e866-42f6-4f5d-8932-9913c1973d7f	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-07 13:02:52.543	2026-02-07 13:02:52.543	[]
82689a4f-643e-4efb-b211-f1b267704b72	a327e866-42f6-4f5d-8932-9913c1973d7f	550e8400-e29b-41d4-a716-446655440007	1	\N	served	2026-02-07 13:02:52.543	2026-02-07 13:02:52.543	[]
349f7b8e-9674-47fa-aa66-e022baa5f9a0	a327e866-42f6-4f5d-8932-9913c1973d7f	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-02-07 13:02:52.543	2026-02-07 13:02:52.543	[]
b30e9b7e-7bca-43f8-87a4-dc9369837522	a327e866-42f6-4f5d-8932-9913c1973d7f	550e8400-e29b-41d4-a716-446655440001	1	\N	served	2026-02-07 13:02:52.543	2026-02-07 13:02:52.543	[]
c3025aed-a166-4206-9931-f37e70f5a196	576860d4-f5cd-4706-8ad8-c264096d3394	550e8400-e29b-41d4-a716-446655440007	1	\N	served	2026-02-09 07:10:52.558	2026-02-09 07:10:52.558	[]
b51d8e00-6a30-458b-9af0-3da14fe77a81	576860d4-f5cd-4706-8ad8-c264096d3394	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-09 07:10:52.558	2026-02-09 07:10:52.558	[]
fc51770e-911f-4fa9-9076-9067c943ce6f	6c59bc11-4612-4ce1-bf41-ec4a487c5ac8	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-02-08 06:58:52.57	2026-02-08 06:58:52.57	[]
f7824a0c-dda5-4cd4-9059-0be57d31b856	6c59bc11-4612-4ce1-bf41-ec4a487c5ac8	550e8400-e29b-41d4-a716-446655440006	1	\N	served	2026-02-08 06:58:52.57	2026-02-08 06:58:52.57	[]
8517247c-1fd7-447d-aeba-e9a2e52668b3	78e3ab86-5ee9-47ba-9c82-db7930701656	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-02-06 09:09:52.581	2026-02-06 09:09:52.581	[]
bfa69f1a-c9fb-459d-a46e-456edb5e2291	78e3ab86-5ee9-47ba-9c82-db7930701656	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-06 09:09:52.581	2026-02-06 09:09:52.581	[]
3968a023-4ba7-4fe5-9fb5-1114936fe865	78e3ab86-5ee9-47ba-9c82-db7930701656	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-06 09:09:52.581	2026-02-06 09:09:52.581	[]
c8d8af04-e43a-4a42-b482-2de29113a7c8	7cb4a444-ad13-4387-9446-86756cee32b4	550e8400-e29b-41d4-a716-446655440001	1	\N	served	2026-02-04 09:14:52.593	2026-02-04 09:14:52.593	[]
26b10f6d-b616-4349-81de-1e524599f556	7cb4a444-ad13-4387-9446-86756cee32b4	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-04 09:14:52.593	2026-02-04 09:14:52.593	[]
5d731aa3-985c-45f7-85b6-5354d851aa7c	8279da68-387a-4e6b-878f-3c5c8486e4d0	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-10 09:56:52.603	2026-02-10 09:56:52.603	[]
87c937e5-4a95-467b-b6e1-caf201621fb9	8279da68-387a-4e6b-878f-3c5c8486e4d0	550e8400-e29b-41d4-a716-446655440011	1	\N	served	2026-02-10 09:56:52.603	2026-02-10 09:56:52.603	[]
256b685e-281c-4fa9-911f-b80d92c5ea23	8279da68-387a-4e6b-878f-3c5c8486e4d0	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-10 09:56:52.603	2026-02-10 09:56:52.603	[]
19e7f771-6102-4475-a34a-648fce837390	8279da68-387a-4e6b-878f-3c5c8486e4d0	550e8400-e29b-41d4-a716-446655440007	1	\N	served	2026-02-10 09:56:52.603	2026-02-10 09:56:52.603	[]
343152d9-15f6-474c-9cea-d4d011b69f62	f35845e6-7c8a-4a9b-b9cb-2e8086945e54	550e8400-e29b-41d4-a716-446655440006	1	\N	served	2026-02-09 07:16:52.613	2026-02-09 07:16:52.613	[]
029ea0ab-b200-467b-9c8e-4ae4ed8019e2	f35845e6-7c8a-4a9b-b9cb-2e8086945e54	550e8400-e29b-41d4-a716-446655440009	1	\N	served	2026-02-09 07:16:52.613	2026-02-09 07:16:52.613	[]
ed940d7c-13c2-4ca9-b612-dd37c417102b	b21d3047-688b-4a36-b62b-a98125e8f711	550e8400-e29b-41d4-a716-446655440005	1	\N	served	2026-02-05 07:13:52.624	2026-02-05 07:13:52.624	[]
a354058e-16af-4f5b-819f-49a2878e3a4a	b21d3047-688b-4a36-b62b-a98125e8f711	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-05 07:13:52.624	2026-02-05 07:13:52.624	[]
67699410-65a5-47ec-9623-d3ab306bb0cc	b21d3047-688b-4a36-b62b-a98125e8f711	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-05 07:13:52.624	2026-02-05 07:13:52.624	[]
a7b84a3e-37e8-47b3-b844-04e2fbf9c022	4a15b1a1-7cd2-4f4c-be19-5b49b57276a3	550e8400-e29b-41d4-a716-446655440006	1	\N	pending	2026-02-10 10:51:37.199	2026-02-10 10:51:37.199	[]
06483f5d-56ab-4d48-b957-338bb28f8c72	c86e39d1-0267-441c-9610-104b4a56ff8c	550e8400-e29b-41d4-a716-446655440001	1	\N	served	2026-02-10 10:50:35.756	2026-02-10 11:33:53.532	[]
36ca8459-65b1-4fea-8482-5fbb683eae55	c86e39d1-0267-441c-9610-104b4a56ff8c	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-10 10:50:35.756	2026-02-10 11:33:53.532	[]
935f09e4-d663-4926-b449-49ee0c3b4b9e	c86e39d1-0267-441c-9610-104b4a56ff8c	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-10 10:50:35.756	2026-02-10 11:33:53.532	[]
bb96b4ca-301a-4f61-b360-168d814b107f	08efb964-13e2-4920-9cfc-03e65270745e	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-02-10 10:51:30.359	2026-02-10 11:34:02.839	[]
b8f02de5-f1dc-4830-b7dd-7741be98760f	b8c10552-34c1-4585-8fd9-786f0e2e5517	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-10 11:34:30.304	2026-02-10 11:37:14.124	[]
e6c9d567-57c9-4af7-be8c-df87a4991ac7	08efb964-13e2-4920-9cfc-03e65270745e	550e8400-e29b-41d4-a716-446655440000	1	\N	served	2026-02-10 10:51:30.359	2026-02-10 11:34:02.839	[]
860361bc-c77c-4b06-a3f4-5bbb4e100b57	b8c10552-34c1-4585-8fd9-786f0e2e5517	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-10 11:34:30.304	2026-02-10 11:37:14.124	[]
7e785f92-7b78-45d6-b5db-5acfa88f78cc	6d8c4c04-1680-421d-9684-07440d82f05d	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-02-10 11:34:38.628	2026-02-10 11:37:22.586	[]
69eb639d-16f0-43ee-a47e-c9bc0efce9ac	1e67402f-689c-4f7b-a4ce-625df08041d9	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-10 11:34:48.547	2026-02-10 11:37:36.826	[]
f99141f8-56fa-4372-aeed-d928197ce324	08efb964-13e2-4920-9cfc-03e65270745e	550e8400-e29b-41d4-a716-446655440011	1	\N	served	2026-02-10 10:51:30.359	2026-02-10 11:34:02.839	[]
ed048c3b-7b1f-4490-8fc8-d381bbecf008	08efb964-13e2-4920-9cfc-03e65270745e	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-10 10:51:30.359	2026-02-10 11:34:02.839	[]
83bd3270-cd03-48b2-9589-a717b26a535c	08efb964-13e2-4920-9cfc-03e65270745e	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-10 10:51:30.359	2026-02-10 11:34:02.839	[]
d73e019b-af29-47fe-b949-916e52fd9774	d05cc54c-e2fe-4e6f-aea1-b262116655dc	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-10 10:53:25.636	2026-02-10 11:34:10.725	[]
2d5a312a-b7a4-4916-a90a-f6f0ebfaccf0	d05cc54c-e2fe-4e6f-aea1-b262116655dc	550e8400-e29b-41d4-a716-446655440003	1	\N	served	2026-02-10 10:53:25.636	2026-02-10 11:34:10.725	[]
2b3c1aa1-cd6a-4b7d-bc3f-3e0c531a0201	d05cc54c-e2fe-4e6f-aea1-b262116655dc	550e8400-e29b-41d4-a716-446655440009	1	\N	served	2026-02-10 10:53:25.636	2026-02-10 11:34:10.725	[]
f12d69b4-ca3b-4daa-ba89-d9ba643a8b01	d0adf605-b2c8-410a-9bb1-57c7bc51e7fe	550e8400-e29b-41d4-a716-446655440008	1	\N	served	2026-02-10 10:53:56.481	2026-02-10 11:34:19.339	[]
e46c4ef0-fb37-4616-8a67-dae603f68073	d0adf605-b2c8-410a-9bb1-57c7bc51e7fe	550e8400-e29b-41d4-a716-446655440006	1	\N	served	2026-02-10 10:53:56.481	2026-02-10 11:34:19.339	[]
b61a76fc-9149-4e79-83fe-9a66c63593aa	d0adf605-b2c8-410a-9bb1-57c7bc51e7fe	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-10 10:53:56.481	2026-02-10 11:34:19.339	[]
544caae6-3e4d-4313-8a48-ca8a6c9153ea	6d8c4c04-1680-421d-9684-07440d82f05d	550e8400-e29b-41d4-a716-446655440002	1	\N	served	2026-02-10 11:34:38.628	2026-02-10 11:37:22.586	[]
d3a0c158-f207-438b-b50a-092a37bf7fe4	6d8c4c04-1680-421d-9684-07440d82f05d	550e8400-e29b-41d4-a716-446655440011	1	\N	served	2026-02-10 11:34:38.628	2026-02-10 11:37:22.586	[]
ecb2d65b-b59b-42c0-b18f-9c1cca64248a	1e67402f-689c-4f7b-a4ce-625df08041d9	550e8400-e29b-41d4-a716-446655440001	1	\N	served	2026-02-10 11:34:48.547	2026-02-10 11:37:36.826	[]
e3b359df-d872-4a20-8ef9-69e1eaab059d	1e67402f-689c-4f7b-a4ce-625df08041d9	550e8400-e29b-41d4-a716-446655440007	1	\N	served	2026-02-10 11:34:48.547	2026-02-10 11:37:36.826	[]
88e58126-a67c-4b08-815b-ecd5b9227f7c	6fdebba1-1c57-4f65-b13e-77668fb1475e	550e8400-e29b-41d4-a716-446655440004	1	\N	served	2026-02-10 11:34:57.891	2026-02-10 11:37:05.486	[]
fb1cd950-5e9c-42a0-9240-8474f33382cd	6fdebba1-1c57-4f65-b13e-77668fb1475e	550e8400-e29b-41d4-a716-446655440011	1	\N	served	2026-02-10 11:34:57.891	2026-02-10 11:37:05.486	[]
3b0ebfe5-a2b4-4c92-9d7c-b3f6de157b38	6fdebba1-1c57-4f65-b13e-77668fb1475e	550e8400-e29b-41d4-a716-446655440001	1	\N	served	2026-02-10 11:34:57.891	2026-02-10 11:37:05.486	[]
\.


--
-- TOC entry 5212 (class 0 OID 35983)
-- Dependencies: 223
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, table_number, status, created_by, total, discount_type, discount_value, is_paid, payment_method, created_at, updated_at, cancel_reason, hold_status, order_number, parent_order_id) FROM stdin;
42aaca50-0c4d-49f3-904e-ecb53c7a6658	3	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	888.30	\N	0.00	t	cash	2026-01-30 06:57:16.567	2026-01-30 06:57:16.567	\N	f	1	\N
083c317a-b47e-45bf-8153-c908acfe9ea9	9	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	1046.85	\N	0.00	t	card	2026-01-31 07:18:16.583	2026-01-31 07:18:16.583	\N	f	2	\N
042b6a8a-37c4-473f-bdb8-df654a91e9d5	8	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	575.40	\N	0.00	t	upi	2026-02-02 10:47:16.592	2026-02-02 10:47:16.592	\N	f	3	\N
58fe319d-918a-4552-aaac-17616560d197	7	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	835.80	\N	0.00	t	cash	2026-02-02 13:16:16.6	2026-02-02 13:16:16.6	\N	f	4	\N
4f5696b4-8ffe-43fb-8c90-510010068363	3	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	940.80	\N	0.00	t	card	2026-02-03 10:38:16.608	2026-02-03 10:38:16.608	\N	f	5	\N
9370bab0-d0d2-4f19-98c0-4e88207f0aa5	7	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	1150.80	\N	0.00	t	upi	2026-02-05 10:44:16.622	2026-02-05 10:44:16.622	\N	f	6	\N
a30db5b0-51b4-4634-95fc-99d8d31318a3	4	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	627.90	\N	0.00	t	cash	2026-02-04 13:27:16.631	2026-02-04 13:27:16.631	\N	f	7	\N
6167734a-8241-4e57-aca5-70cd4716c238	9	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	522.90	\N	0.00	t	card	2026-02-01 08:12:16.64	2026-02-01 08:12:16.64	\N	f	8	\N
ee915e42-ce31-4edd-8ec7-636d7cd95b3b	5	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	836.85	\N	0.00	t	upi	2026-02-05 11:20:16.647	2026-02-05 11:20:16.647	\N	f	9	\N
06a233ed-0650-4b0c-829c-4d7eb2042b62	7	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	835.80	\N	0.00	t	cash	2026-02-03 11:16:16.656	2026-02-03 11:16:16.656	\N	f	10	\N
51209753-f7f5-4ec7-873d-9cdee16335fa	3	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	889.35	\N	0.00	t	card	2026-01-31 07:23:16.664	2026-01-31 07:23:16.664	\N	f	11	\N
d9974a8a-a71a-4162-b663-d6d983775ac0	5	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	993.30	\N	0.00	t	upi	2026-02-01 11:52:16.672	2026-02-01 11:52:16.672	\N	f	12	\N
fbf8d683-82c4-4116-a242-eea50cba4ef0	10	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	470.40	\N	0.00	t	cash	2026-01-31 06:41:16.68	2026-01-31 06:41:16.68	\N	f	13	\N
94606b1a-62d8-4dac-ac4d-d2323f38442e	3	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	941.85	\N	0.00	t	card	2026-02-01 11:57:16.688	2026-02-01 11:57:16.688	\N	f	14	\N
29844479-103a-4f0e-857e-83c3b4703977	1	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	730.80	\N	0.00	t	upi	2026-01-30 10:42:16.696	2026-01-30 10:42:16.696	\N	f	15	\N
d45103d9-2fd7-4220-adcf-66552a22dff9	7	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	1098.30	\N	0.00	t	cash	2026-01-30 06:46:16.705	2026-01-30 06:46:16.705	\N	f	16	\N
5cdaca29-f1e1-4899-a56e-f78a3749e385	6	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	1308.30	\N	0.00	t	card	2026-02-01 07:17:16.713	2026-02-01 07:17:16.713	\N	f	17	\N
d8b8c2a4-1832-4ad9-bb7b-d88364fea295	8	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	417.90	\N	0.00	t	upi	2026-02-05 11:23:16.723	2026-02-05 11:23:16.723	\N	f	18	\N
825bfbbe-76e6-4968-9d6a-10546c1687c2	9	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	522.90	\N	0.00	t	cash	2026-02-04 12:49:16.732	2026-02-04 12:49:16.732	\N	f	19	\N
006a9bef-7c38-4391-954e-07c105cadd39	1	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	522.90	\N	0.00	t	card	2026-02-03 07:44:16.741	2026-02-03 07:44:16.741	\N	f	20	\N
77a72c34-e208-40a1-a392-f495d01820d7	1	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	448.00	\N	0.00	t	upi	2026-02-05 11:40:15.026	2026-02-05 11:40:25.88	\N	f	28	\N
ca4133f1-b492-471b-86b2-9620c01362ce	1	cancelled	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	547.00	\N	0.00	t	cash	2026-02-05 12:05:38.902	2026-02-06 06:11:53.247	\N	f	32	cccac53e-63b1-4e46-892e-d9db896c7a4b
da2e1cf6-1632-4c22-9359-90ad4549f7c4	10	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	448.00	\N	0.00	t	cash	2026-02-05 11:09:25.656	2026-02-05 11:12:38.096	\N	f	21	\N
60da06ed-b2a3-4d2b-b61a-24bd89933cfd	1	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	548.00	\N	0.00	t	cash	2026-02-05 11:40:35.156	2026-02-05 11:41:02.726	\N	f	29	\N
2fc63386-3463-456a-bf46-d0384986ce35	10	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	597.00	\N	0.00	t	cash	2026-02-05 11:14:05.169	2026-02-05 11:14:28.341	\N	f	23	\N
2b7fd5a6-4b90-40e5-b7c1-4cd6d7b3c85c	10	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	399.00	\N	0.00	t	cash	2026-02-05 11:20:29.758	2026-02-05 11:21:17.462	\N	f	24	\N
f664aafd-3cf5-477e-8d7d-539ffb61056e	4	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	199.00	\N	0.00	t	upi	2026-02-05 12:06:51.232	2026-02-05 12:07:14.584	\N	f	34	cb5d1652-7062-47f1-a14a-65610627f9ff
e8c8724f-c87e-4d94-b6ef-30497ae0aea2	7	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	597.00	\N	0.00	t	cash	2026-02-05 11:30:51.814	2026-02-05 11:31:13.104	\N	f	25	\N
cccac53e-63b1-4e46-892e-d9db896c7a4b	1	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	547.00	\N	0.00	t	cash	2026-02-05 11:47:45.475	2026-02-05 11:58:25.565	\N	f	30	\N
b1ebdfe9-0d07-420b-8bc7-dcd3ba298ffb	7	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	697.00	\N	0.00	t	cash	2026-02-05 11:31:23.57	2026-02-05 11:31:55.75	\N	f	26	\N
65e80f75-9987-4717-9bb7-fd873d38419d	1	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	1044.00	\N	0.00	t	cash	2026-02-05 11:38:47.073	2026-02-05 11:39:48.511	\N	f	27	\N
e30ebe8b-b082-41ca-9cea-b17f38bd117c	1	cancelled	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	547.00	\N	0.00	t	cash	2026-02-05 11:58:42.762	2026-02-06 06:11:57.299	\N	f	31	\N
58b0300d-9225-49e2-961b-04e199f855ff	8	pending	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	149.00	\N	0.00	t	cash	2026-02-06 11:13:16.23	2026-02-06 11:16:06.864	\N	f	43	\N
f875e81d-d595-49a0-919d-ad10b6577fc7	5	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	49.00	\N	0.00	t	card	2026-02-05 12:16:10.735	2026-02-05 12:16:35.073	\N	f	35	\N
cb5d1652-7062-47f1-a14a-65610627f9ff	4	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	199.00	\N	0.00	t	card	2026-02-05 12:06:12.119	2026-02-05 12:06:41.321	\N	f	33	\N
d06e7f49-8ab9-465e-b7a7-b719369cf076	10	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	99.00	\N	0.00	t	card	2026-02-06 04:54:22.168	2026-02-06 04:55:32.816	\N	f	38	36fa86f1-d3a0-4c4a-86ba-abbfb9a1e88e
36fa86f1-d3a0-4c4a-86ba-abbfb9a1e88e	10	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	547.00	\N	0.00	t	card	2026-02-06 04:51:23.305	2026-02-06 04:51:56.758	\N	f	37	\N
03daaab1-f9b2-42c5-b719-2ce227403899	5	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	399.00	\N	0.00	t	card	2026-02-05 12:16:46.846	2026-02-05 12:17:09.686	\N	f	36	f875e81d-d595-49a0-919d-ad10b6577fc7
09a3f462-80d9-4fae-ad88-39ba3152188c	1	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	199.00	\N	0.00	t	cash	2026-02-06 11:04:08.06	2026-02-06 11:04:26.497	\N	f	40	\N
2aa72427-9472-4a26-9fcf-d46db9fe426c	10	cancelled	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	747.00	\N	0.00	t	cash	2026-02-05 11:12:47.273	2026-02-06 06:11:51.189	\N	f	22	\N
499eece0-600f-4efc-a9a6-9b5647c9749e	7	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	49.00	\N	0.00	t	cash	2026-02-06 11:07:20.508	2026-02-06 11:07:47.61	\N	f	41	\N
5cef9940-f827-445e-b125-93ff75f8e0a8	3	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	448.00	\N	0.00	t	card	2026-02-06 07:11:51.907	2026-02-06 07:12:28.092	\N	f	39	\N
ee2e64d0-deed-4091-9da5-5ded9a3e9202	10	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	398.00	\N	0.00	t	cash	2026-02-06 11:12:44.102	2026-02-06 11:13:03.274	\N	f	42	\N
46e08d26-ceaa-4f4b-8f70-1e3c9b6591df	8	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	836.85	\N	0.00	t	cash	2026-02-08 10:15:52.357	2026-02-08 10:15:52.357	\N	f	45	\N
0cd8c16b-b433-4637-bc45-b7190f524c0a	9	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	470.40	\N	0.00	t	card	2026-02-08 13:55:52.42	2026-02-08 13:55:52.42	\N	f	46	\N
1e7fb7ff-bbb3-4fa4-a1b1-87a12beb80d3	10	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	1045.80	\N	0.00	t	upi	2026-02-07 09:01:52.429	2026-02-07 09:01:52.429	\N	f	47	\N
405617f5-6638-4e88-8e4d-5440b8ac61e2	1	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	994.35	\N	0.00	t	cash	2026-02-04 06:55:52.438	2026-02-04 06:55:52.438	\N	f	48	\N
8d9a2cb4-a7ec-4b85-9e89-0fd0a7dd7446	1	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	1308.30	\N	0.00	t	card	2026-02-07 12:38:52.446	2026-02-07 12:38:52.446	\N	f	49	\N
93a3b281-59e8-4603-8ec1-3a7d51d794c1	1	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	470.40	\N	0.00	t	upi	2026-02-08 07:47:52.457	2026-02-08 07:47:52.457	\N	f	50	\N
0e90f75d-c597-458b-97ce-40f1c9b07c40	6	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	1098.30	\N	0.00	t	cash	2026-02-09 08:45:52.466	2026-02-09 08:45:52.466	\N	f	51	\N
fcec4231-7525-4787-960e-d24973dfd460	8	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	835.80	\N	0.00	t	card	2026-02-09 08:35:52.478	2026-02-09 08:35:52.478	\N	f	52	\N
51c3e194-6576-4340-bbb1-f5a1537e126a	3	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	1203.30	\N	0.00	t	upi	2026-02-10 11:52:52.491	2026-02-10 11:52:52.491	\N	f	53	\N
4dd32edc-063f-4e05-a832-93c6335a72a2	3	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	940.80	\N	0.00	t	cash	2026-02-05 07:01:52.504	2026-02-05 07:01:52.504	\N	f	54	\N
875f272b-b8d1-4a8e-9ab2-1e2b9eb71f12	6	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	575.40	\N	0.00	t	card	2026-02-04 11:50:52.518	2026-02-04 11:50:52.518	\N	f	55	\N
e33750fc-9e30-4e35-a3e8-3e90c985dd92	9	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	679.35	\N	0.00	t	upi	2026-02-07 12:38:52.53	2026-02-07 12:38:52.53	\N	f	56	\N
a327e866-42f6-4f5d-8932-9913c1973d7f	5	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	1413.30	\N	0.00	t	cash	2026-02-07 13:02:52.543	2026-02-07 13:02:52.543	\N	f	57	\N
576860d4-f5cd-4706-8ad8-c264096d3394	8	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	627.90	\N	0.00	t	card	2026-02-09 07:10:52.558	2026-02-09 07:10:52.558	\N	f	58	\N
6c59bc11-4612-4ce1-bf41-ec4a487c5ac8	3	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	837.90	\N	0.00	t	upi	2026-02-08 06:58:52.57	2026-02-08 06:58:52.57	\N	f	59	\N
78e3ab86-5ee9-47ba-9c82-db7930701656	8	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	626.85	\N	0.00	t	cash	2026-02-06 09:09:52.581	2026-02-06 09:09:52.581	\N	f	60	\N
7cb4a444-ad13-4387-9446-86756cee32b4	3	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	627.90	\N	0.00	t	card	2026-02-04 09:14:52.593	2026-02-04 09:14:52.593	\N	f	61	\N
8279da68-387a-4e6b-878f-3c5c8486e4d0	5	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	1045.80	\N	0.00	t	upi	2026-02-10 09:56:52.603	2026-02-10 09:56:52.603	\N	f	62	\N
f35845e6-7c8a-4a9b-b9cb-2e8086945e54	6	served	ac479ba7-39b7-4add-8f70-c6a0951c3c24	680.40	\N	0.00	t	cash	2026-02-09 07:16:52.613	2026-02-09 07:16:52.613	\N	f	63	\N
b21d3047-688b-4a36-b62b-a98125e8f711	9	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	889.35	\N	0.00	t	card	2026-02-05 07:13:52.624	2026-02-05 07:13:52.624	\N	f	64	\N
4a15b1a1-7cd2-4f4c-be19-5b49b57276a3	6	pending	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	449.00	\N	0.00	f	\N	2026-02-10 10:51:37.199	2026-02-10 10:51:37.199	\N	f	67	\N
be05ab02-c88d-4946-9594-2dd06e179ae3	1	delivered	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	847.00	\N	0.00	t	cash	2026-02-10 06:37:09.331	2026-02-10 11:27:00.265	\N	f	44	\N
b8c10552-34c1-4585-8fd9-786f0e2e5517	1	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	348.00	\N	0.00	t	upi	2026-02-10 11:34:30.304	2026-02-10 11:37:16.678	\N	f	70	\N
6d8c4c04-1680-421d-9684-07440d82f05d	15	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	547.00	\N	0.00	t	card	2026-02-10 11:34:38.628	2026-02-10 11:37:29.251	\N	f	71	\N
1e67402f-689c-4f7b-a4ce-625df08041d9	13	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	947.00	\N	0.00	t	cash	2026-02-10 11:34:48.547	2026-02-10 11:37:39.397	\N	f	72	\N
d05cc54c-e2fe-4e6f-aea1-b262116655dc	12	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	597.00	\N	0.00	t	card	2026-02-10 10:53:25.636	2026-02-10 11:34:13.89	\N	f	68	\N
d0adf605-b2c8-410a-9bb1-57c7bc51e7fe	10	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	797.00	\N	0.00	t	card	2026-02-10 10:53:56.481	2026-02-10 11:34:22.26	\N	f	69	\N
c86e39d1-0267-441c-9610-104b4a56ff8c	1	delivered	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	797.00	\N	0.00	t	card	2026-02-10 10:50:35.756	2026-02-10 11:35:03.983	\N	f	65	\N
08efb964-13e2-4920-9cfc-03e65270745e	4	delivered	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	995.00	\N	0.00	t	cash	2026-02-10 10:51:30.359	2026-02-10 11:35:06.91	\N	f	66	\N
6fdebba1-1c57-4f65-b13e-77668fb1475e	4	served	31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	697.00	\N	0.00	t	cash	2026-02-10 11:34:57.891	2026-02-10 11:37:07.924	\N	f	73	\N
\.


--
-- TOC entry 5223 (class 0 OID 36171)
-- Dependencies: 234
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_transactions (id, order_id, amount, method, status, transaction_id, created_at) FROM stdin;
7064e14c-5d9c-4e5c-8fca-30d51ee0ee31	42aaca50-0c4d-49f3-904e-ecb53c7a6658	888.30	cash	completed	\N	2026-01-30 06:57:16.567
ee2af4d7-5bd4-456d-9e84-877c335afff5	083c317a-b47e-45bf-8153-c908acfe9ea9	1046.85	card	completed	\N	2026-01-31 07:18:16.583
922d7bfd-9e69-4608-8d94-709d6fe4e67e	042b6a8a-37c4-473f-bdb8-df654a91e9d5	575.40	upi	completed	\N	2026-02-02 10:47:16.592
c5b45afa-39a1-49ce-84f8-9786a9f6037a	58fe319d-918a-4552-aaac-17616560d197	835.80	cash	completed	\N	2026-02-02 13:16:16.6
48e15a56-1544-4350-b5c2-77a0fddd142a	4f5696b4-8ffe-43fb-8c90-510010068363	940.80	card	completed	\N	2026-02-03 10:38:16.608
67131091-b87d-415e-8b7e-cc0813df38d3	9370bab0-d0d2-4f19-98c0-4e88207f0aa5	1150.80	upi	completed	\N	2026-02-05 10:44:16.622
294c1e8d-b65d-4119-a1a8-56acc0618582	a30db5b0-51b4-4634-95fc-99d8d31318a3	627.90	cash	completed	\N	2026-02-04 13:27:16.631
7b672277-1efc-4d86-9f03-440a4a3ba423	6167734a-8241-4e57-aca5-70cd4716c238	522.90	card	completed	\N	2026-02-01 08:12:16.64
445fa3d4-8222-4183-82fc-daf07581de88	ee915e42-ce31-4edd-8ec7-636d7cd95b3b	836.85	upi	completed	\N	2026-02-05 11:20:16.647
63f05e73-39a8-45c4-a247-8f8bbac92ceb	06a233ed-0650-4b0c-829c-4d7eb2042b62	835.80	cash	completed	\N	2026-02-03 11:16:16.656
d077a451-1c05-45d1-85ef-0b16909c2788	51209753-f7f5-4ec7-873d-9cdee16335fa	889.35	card	completed	\N	2026-01-31 07:23:16.664
0ac962d8-6e8e-40ce-ab73-9b7fe53c1ff8	d9974a8a-a71a-4162-b663-d6d983775ac0	993.30	upi	completed	\N	2026-02-01 11:52:16.672
b3cb1118-e4d8-4b32-976c-8a422e97b042	fbf8d683-82c4-4116-a242-eea50cba4ef0	470.40	cash	completed	\N	2026-01-31 06:41:16.68
a24fd5ab-9810-4f7a-b10a-c43e6d2f266c	94606b1a-62d8-4dac-ac4d-d2323f38442e	941.85	card	completed	\N	2026-02-01 11:57:16.688
a2e77ddf-6111-4813-940c-348ed1c0abbd	29844479-103a-4f0e-857e-83c3b4703977	730.80	upi	completed	\N	2026-01-30 10:42:16.696
207045e5-9827-4cd0-a1e1-71cbcff84688	d45103d9-2fd7-4220-adcf-66552a22dff9	1098.30	cash	completed	\N	2026-01-30 06:46:16.705
35349f06-2990-4dc4-a239-9f9daec24ae3	5cdaca29-f1e1-4899-a56e-f78a3749e385	1308.30	card	completed	\N	2026-02-01 07:17:16.713
767e495f-9a50-4eee-a600-16a9b95db6b6	d8b8c2a4-1832-4ad9-bb7b-d88364fea295	417.90	upi	completed	\N	2026-02-05 11:23:16.723
5d464fe2-7516-4e59-a733-0444d6d450bf	825bfbbe-76e6-4968-9d6a-10546c1687c2	522.90	cash	completed	\N	2026-02-04 12:49:16.732
6b77a5de-551a-441a-b59f-63d86f757c14	006a9bef-7c38-4391-954e-07c105cadd39	522.90	card	completed	\N	2026-02-03 07:44:16.741
12f9d52d-cb6a-4a7c-9629-b92667833f13	da2e1cf6-1632-4c22-9359-90ad4549f7c4	470.40	cash	completed	\N	2026-02-05 11:12:38.086
883d6ef8-d869-40e2-a2c6-89d0e24fe85f	2aa72427-9472-4a26-9fcf-d46db9fe426c	784.35	cash	completed	\N	2026-02-05 11:13:07.07
cd993bc3-8a42-4d7a-acd9-b02f384c0bbe	2fc63386-3463-456a-bf46-d0384986ce35	626.85	cash	completed	\N	2026-02-05 11:14:12.902
e7044bea-1cca-4a5d-b5d0-5d5a150df003	2b7fd5a6-4b90-40e5-b7c1-4cd6d7b3c85c	418.95	cash	completed	\N	2026-02-05 11:21:17.454
b5491e05-7af6-4a05-a1f7-a2051980bac7	e8c8724f-c87e-4d94-b6ef-30497ae0aea2	626.85	cash	completed	\N	2026-02-05 11:31:13.082
eda6d938-ff3f-4511-845a-c032f96c393d	b1ebdfe9-0d07-420b-8bc7-dcd3ba298ffb	731.85	cash	completed	\N	2026-02-05 11:31:55.741
c8b8045a-9403-461f-9443-f5b9b2e0b1c4	65e80f75-9987-4717-9bb7-fd873d38419d	1096.20	cash	completed	\N	2026-02-05 11:39:48.505
8842a08d-a764-46f9-bcc0-904eeaa91358	77a72c34-e208-40a1-a392-f495d01820d7	470.40	upi	completed	\N	2026-02-05 11:40:25.874
e22ea292-1528-4c16-992d-acee79c0a2e7	60da06ed-b2a3-4d2b-b61a-24bd89933cfd	575.40	cash	completed	\N	2026-02-05 11:41:02.721
011e1137-14bd-44a4-a0fb-124bf755dfaf	cccac53e-63b1-4e46-892e-d9db896c7a4b	574.35	cash	completed	\N	2026-02-05 11:58:25.558
7e0a574e-cad7-41e0-a38b-bd599c4369e4	ca4133f1-b492-471b-86b2-9620c01362ce	574.35	cash	completed	\N	2026-02-05 12:06:01.311
599820c0-d758-46ba-ba20-f02ec17c1a42	cb5d1652-7062-47f1-a14a-65610627f9ff	208.95	card	completed	\N	2026-02-05 12:06:41.316
d6165e11-47be-439c-b2d3-d7585791e836	f664aafd-3cf5-477e-8d7d-539ffb61056e	208.95	upi	completed	\N	2026-02-05 12:07:14.579
fefc9066-eeb6-4c97-a50c-b836822da5c2	f875e81d-d595-49a0-919d-ad10b6577fc7	51.45	card	completed	\N	2026-02-05 12:16:35.069
87b37158-67ca-442a-af7e-7e5af70f42d2	03daaab1-f9b2-42c5-b719-2ce227403899	416.50	card	completed	\N	2026-02-05 12:17:09.681
2d2a1b08-50e8-4ebd-93e3-699767376c4d	36fa86f1-d3a0-4c4a-86ba-abbfb9a1e88e	574.35	card	completed	\N	2026-02-06 04:51:56.754
e2e10354-9889-42a2-8ccb-bac85f09d93a	d06e7f49-8ab9-465e-b7a7-b719369cf076	76.60	card	completed	\N	2026-02-06 04:55:32.811
e7072109-338c-4c7e-9bca-9eb7543c646c	5cef9940-f827-445e-b125-93ff75f8e0a8	470.40	card	completed	\N	2026-02-06 07:12:28.088
d32691b1-cde5-4607-a83b-1c2971104f6f	09a3f462-80d9-4fae-ad88-39ba3152188c	208.95	cash	completed	\N	2026-02-06 11:04:26.489
16bd57af-6139-4e31-9f44-2e10a30695b6	499eece0-600f-4efc-a9a6-9b5647c9749e	51.45	cash	completed	\N	2026-02-06 11:07:47.601
c1e73ad9-2ba9-40ef-aaf4-c32273df2837	ee2e64d0-deed-4091-9da5-5ded9a3e9202	417.90	cash	completed	\N	2026-02-06 11:13:03.262
7d889c14-5afc-4db5-b0c9-87bb2ede6111	58b0300d-9225-49e2-961b-04e199f855ff	156.45	cash	completed	\N	2026-02-06 11:16:06.855
54a5605d-d8fd-47fb-ae07-5280763af89d	be05ab02-c88d-4946-9594-2dd06e179ae3	847.00	cash	completed	\N	2026-02-10 06:37:30.841
cc2067e2-81ca-4068-a68e-fe6cced9f210	46e08d26-ceaa-4f4b-8f70-1e3c9b6591df	836.85	cash	completed	\N	2026-02-08 10:15:52.357
d559d729-bf17-4696-94ee-c54dec3c5e6c	0cd8c16b-b433-4637-bc45-b7190f524c0a	470.40	card	completed	\N	2026-02-08 13:55:52.42
c8ac89c4-5099-4676-920e-274e99030f0b	1e7fb7ff-bbb3-4fa4-a1b1-87a12beb80d3	1045.80	upi	completed	\N	2026-02-07 09:01:52.429
8b6e1d1d-dbcb-49c7-abce-fe7901096cfb	405617f5-6638-4e88-8e4d-5440b8ac61e2	994.35	cash	completed	\N	2026-02-04 06:55:52.438
fa953b2b-3ec6-400a-91db-3da74ae2ccc4	8d9a2cb4-a7ec-4b85-9e89-0fd0a7dd7446	1308.30	card	completed	\N	2026-02-07 12:38:52.446
f50a2ae0-c697-43a6-9e1e-9e52e51f0f67	93a3b281-59e8-4603-8ec1-3a7d51d794c1	470.40	upi	completed	\N	2026-02-08 07:47:52.457
645835ec-794d-454f-bc53-925d1a4a67f6	0e90f75d-c597-458b-97ce-40f1c9b07c40	1098.30	cash	completed	\N	2026-02-09 08:45:52.466
132cbf38-6e8e-41e0-af8f-d3f98d55ef47	fcec4231-7525-4787-960e-d24973dfd460	835.80	card	completed	\N	2026-02-09 08:35:52.478
b209441b-5e49-48fa-b396-491784a9efc3	51c3e194-6576-4340-bbb1-f5a1537e126a	1203.30	upi	completed	\N	2026-02-10 11:52:52.491
8fc4c1f5-de21-4d01-941a-b8fdd7ce20bb	4dd32edc-063f-4e05-a832-93c6335a72a2	940.80	cash	completed	\N	2026-02-05 07:01:52.504
bde894cd-41c7-4ddc-9e43-23a50a41a3ba	875f272b-b8d1-4a8e-9ab2-1e2b9eb71f12	575.40	card	completed	\N	2026-02-04 11:50:52.518
f6294a02-ca8f-48c7-90e0-24ee5c9ff112	e33750fc-9e30-4e35-a3e8-3e90c985dd92	679.35	upi	completed	\N	2026-02-07 12:38:52.53
f84418ff-0b2e-44f4-867a-96b0ca6c0a61	a327e866-42f6-4f5d-8932-9913c1973d7f	1413.30	cash	completed	\N	2026-02-07 13:02:52.543
2cfee0e3-6028-4b2b-afcb-b5fc1bebf676	576860d4-f5cd-4706-8ad8-c264096d3394	627.90	card	completed	\N	2026-02-09 07:10:52.558
5914cd34-3c79-467a-83bb-6e40e4fb8728	6c59bc11-4612-4ce1-bf41-ec4a487c5ac8	837.90	upi	completed	\N	2026-02-08 06:58:52.57
60c340fd-b6e6-445e-9508-afd6c8f68f2c	78e3ab86-5ee9-47ba-9c82-db7930701656	626.85	cash	completed	\N	2026-02-06 09:09:52.581
c3db6be0-c23e-42c3-8b56-d9a0fe6f540c	7cb4a444-ad13-4387-9446-86756cee32b4	627.90	card	completed	\N	2026-02-04 09:14:52.593
d1e24376-9e9e-4c12-b60f-e2ae80080c9d	8279da68-387a-4e6b-878f-3c5c8486e4d0	1045.80	upi	completed	\N	2026-02-10 09:56:52.603
f04ffb2a-fb44-4c0a-9e95-58393d4ef5b4	f35845e6-7c8a-4a9b-b9cb-2e8086945e54	680.40	cash	completed	\N	2026-02-09 07:16:52.613
c37ed507-6fef-441b-92f5-89decbdbe2cc	b21d3047-688b-4a36-b62b-a98125e8f711	889.35	card	completed	\N	2026-02-05 07:13:52.624
3d0b503d-51cf-4951-9747-7dbac1e3acef	c86e39d1-0267-441c-9610-104b4a56ff8c	797.00	card	completed	\N	2026-02-10 11:33:56.554
fc4f0a25-7928-4589-a9ac-1f8247f0e48b	08efb964-13e2-4920-9cfc-03e65270745e	995.00	cash	completed	\N	2026-02-10 11:34:05.95
6699efdb-0718-4998-8fd7-5097fff93a39	d05cc54c-e2fe-4e6f-aea1-b262116655dc	597.00	card	completed	\N	2026-02-10 11:34:13.881
320530a1-05d2-4b11-a9f3-e5928963a7ca	d0adf605-b2c8-410a-9bb1-57c7bc51e7fe	797.00	card	completed	\N	2026-02-10 11:34:22.251
63cfa861-27fc-47ff-818f-8d4f646be8ea	6fdebba1-1c57-4f65-b13e-77668fb1475e	697.00	cash	completed	\N	2026-02-10 11:37:07.912
4a15f1d2-599c-4ddb-9d93-d3b9bfedc462	b8c10552-34c1-4585-8fd9-786f0e2e5517	348.00	upi	completed	\N	2026-02-10 11:37:16.667
5915225f-e927-4cf9-a8b0-6cceb6784730	6d8c4c04-1680-421d-9684-07440d82f05d	547.00	card	completed	\N	2026-02-10 11:37:29.237
198540a5-fe51-408e-b214-a7cc4508606a	1e67402f-689c-4f7b-a4ce-625df08041d9	947.00	cash	completed	\N	2026-02-10 11:37:39.386
\.


--
-- TOC entry 5224 (class 0 OID 36185)
-- Dependencies: 235
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_order_items (id, purchase_order_id, ingredient_id, quantity, unit_cost) FROM stdin;
\.


--
-- TOC entry 5225 (class 0 OID 36197)
-- Dependencies: 236
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_orders (id, supplier_id, status, total_cost, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5226 (class 0 OID 36213)
-- Dependencies: 237
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recipes (id, menu_item_id, ingredient_id, quantity) FROM stdin;
\.


--
-- TOC entry 5214 (class 0 OID 36023)
-- Dependencies: 225
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservations (id, table_number, customer_name, customer_phone, date, start_time, end_time, status, created_at, updated_at) FROM stdin;
14492dbf-ed21-445f-bbe3-a9a302d7017c	7	Sit ea rerum in nis	Eius autem sit ea n	1974-01-02	18:36	03:49	expired	2026-02-06 05:23:51.205	2026-02-06 05:24:05.202
dbdc6ad2-a5b8-4679-b697-efd5e1d28abb	7	sgw4v5gh	4536782828	2026-02-06	12:00	13:00	cancelled	2026-02-06 05:24:16.889	2026-02-06 05:30:55.586
0d5cc086-1e53-4341-ba39-7f1d0605524f	7	uydfth	756756	2026-02-06	12:00	13:00	cancelled	2026-02-06 05:31:16.066	2026-02-06 05:31:27.046
8d1ef046-8119-4263-86fc-31d712b6c176	7	fhytjxf	23456789	2026-02-06	12:00	13:00	cancelled	2026-02-06 05:35:47.728	2026-02-06 05:36:10.706
2baf2bc2-7b33-4118-a6ab-e87315b7d44c	10	ghmkbv	2345557786	2026-02-06	12:00	13:00	cancelled	2026-02-06 05:59:53.742	2026-02-06 06:00:09.109
60fd8079-1842-4b32-ba97-807a74f919e2	11	Molestiae quas cum e	Tenetur totam labori	2023-07-03	13:37	04:23	expired	2026-02-10 10:52:29.175	2026-02-10 10:52:35.901
2a0b3036-3dd5-46b0-a3c5-b5357941ca8a	11	Alias similique volu	Ut numquam in explic	2026-02-11	07:55	23:31	pending	2026-02-10 10:52:57.223	2026-02-10 10:52:57.223
\.


--
-- TOC entry 5216 (class 0 OID 36056)
-- Dependencies: 227
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, tax_rate, currency, restaurant_name, discount_presets, printer_config, updated_at, business_hours, enabled_payment_methods, receipt_footer, gst_no, restaurant_address, tax_enabled, notification_preferences, reservation_grace_period) FROM stdin;
default	5.00	₹	The Golden Fork	[5, 10, 15, 20]	{"enabled": true, "printerName": "Kitchen Printer 1"}	2026-02-07 04:09:30.522	{"open": "09:00", "close": "22:00"}	{cash,card,upi}	Thank you for your business!			f	{}	15
\.


--
-- TOC entry 5227 (class 0 OID 36224)
-- Dependencies: 238
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, name, contact_name, email, phone, address, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5209 (class 0 OID 35947)
-- Dependencies: 220
-- Data for Name: tables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tables (id, number, capacity, status, current_order_id, reserved_by, reserved_time, created_at, updated_at, group_id, is_primary) FROM stdin;
53a92626-3ad5-4e1a-9a29-25cae6d21600	2	4	free	\N	\N	\N	2026-02-05 11:07:16.335	2026-02-05 11:07:16.335	\N	f
09cf4a8c-b512-4b6e-94a8-e44a5b8de9bc	9	4	free	\N	\N	\N	2026-02-05 11:07:16.344	2026-02-05 11:07:16.344	\N	f
e516a533-756d-426d-858d-686498ca205c	12	2	free	\N	\N	\N	2026-02-07 04:11:00.578	2026-02-10 11:34:15.776	\N	f
f81cb5e7-250a-41af-af98-214e7436a17f	10	6	free	\N	\N	\N	2026-02-05 11:07:16.345	2026-02-10 11:34:23.914	\N	f
794eb043-bbf6-4af1-9d1a-106d145b615a	3	4	free	\N	\N	\N	2026-02-05 11:07:16.342	2026-02-06 07:12:59.001	\N	f
ffda95c0-d833-4e6c-9691-7aaf35eacb50	4	6	free	\N	\N	\N	2026-02-05 11:07:16.342	2026-02-10 11:37:10.152	\N	f
470470b1-3fc8-442a-ac18-644713537224	1	2	free	\N	\N	\N	2026-02-05 11:07:16.335	2026-02-10 11:37:18.415	\N	f
96d9c125-b1bf-4177-8286-e8da06d260f1	15	2	free	\N	\N	\N	2026-02-07 04:11:00.578	2026-02-10 11:37:31.561	\N	f
a1208ebd-89b2-48a5-bc02-8263bf4cb362	13	2	free	\N	\N	\N	2026-02-07 04:11:00.578	2026-02-10 11:37:40.787	\N	f
8a7af87b-10dd-41fc-b674-c9a68fa4d47f	7	8	free	\N	\N	\N	2026-02-05 11:07:16.343	2026-02-10 11:38:12.569	\N	f
8cfbe603-5194-48fa-b6e1-f7457d51693e	6	4	free	4a15b1a1-7cd2-4f4c-be19-5b49b57276a3	\N	\N	2026-02-05 11:07:16.343	2026-02-10 11:38:14.262	\N	f
ab06b28f-4a6e-4f51-aa1f-12dd477dae45	8	2	free	\N	\N	\N	2026-02-05 11:07:16.344	2026-02-06 11:16:09.945	\N	f
ba2db9e9-d20f-494a-9442-772c3ddc6db5	11	2	free	\N	\N	\N	2026-02-07 04:11:00.578	2026-02-07 04:11:00.578	\N	f
a7d0ea5f-8a8c-4347-9adc-a4dbe0034276	14	2	free	\N	\N	\N	2026-02-07 04:11:00.578	2026-02-07 04:11:00.578	\N	f
eed6734d-057e-4a15-b1f7-89b1029ceae9	5	2	free	\N	\N	\N	2026-02-05 11:07:16.343	2026-02-05 12:17:09.686	\N	f
\.


--
-- TOC entry 5208 (class 0 OID 35929)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, active, created_at, updated_at) FROM stdin;
ac479ba7-39b7-4add-8f70-c6a0951c3c24	Admin User	admin@restaurant.com	$2a$12$GzDEdk84M4IpNyOC7xUPBe0tFH/dmU.CCncQ4yrSVby4oiFG4Q/Ym	admin	t	2026-02-05 11:07:16.237	2026-02-05 11:07:16.237
31a41d7e-9db6-4b2e-9f2f-59ff9e4ae9c7	John Doe	waiter@restaurant.com	$2a$12$GzDEdk84M4IpNyOC7xUPBe0tFH/dmU.CCncQ4yrSVby4oiFG4Q/Ym	waiter	t	2026-02-05 11:07:16.238	2026-02-05 11:07:16.238
892a6e74-02b6-4f39-ba28-cc94a4b82e19	Mike Johnson	kitchen@restaurant.com	$2a$12$GzDEdk84M4IpNyOC7xUPBe0tFH/dmU.CCncQ4yrSVby4oiFG4Q/Ym	kitchen	t	2026-02-05 11:07:16.238	2026-02-05 11:07:16.238
\.


--
-- TOC entry 5236 (class 0 OID 0)
-- Dependencies: 222
-- Name: orders_order_number_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_order_number_seq', 73, true);


--
-- TOC entry 5020 (class 2606 OID 36112)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5023 (class 2606 OID 36126)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5018 (class 2606 OID 36100)
-- Name: daily_sales daily_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_sales
    ADD CONSTRAINT daily_sales_pkey PRIMARY KEY (id);


--
-- TOC entry 5026 (class 2606 OID 36140)
-- Name: delivery_details delivery_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_details
    ADD CONSTRAINT delivery_details_pkey PRIMARY KEY (id);


--
-- TOC entry 5029 (class 2606 OID 36157)
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);


--
-- TOC entry 5031 (class 2606 OID 36170)
-- Name: menu_item_modifiers menu_item_modifiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_item_modifiers
    ADD CONSTRAINT menu_item_modifiers_pkey PRIMARY KEY (id);


--
-- TOC entry 5004 (class 2606 OID 35981)
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5013 (class 2606 OID 36055)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5009 (class 2606 OID 36022)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5007 (class 2606 OID 36005)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 5033 (class 2606 OID 36184)
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5035 (class 2606 OID 36196)
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5037 (class 2606 OID 36212)
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 5039 (class 2606 OID 36223)
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- TOC entry 5011 (class 2606 OID 36040)
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- TOC entry 5015 (class 2606 OID 36083)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5042 (class 2606 OID 36235)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 5002 (class 2606 OID 35961)
-- Name: tables tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);


--
-- TOC entry 4999 (class 2606 OID 35946)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5021 (class 1259 OID 36240)
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- TOC entry 5016 (class 1259 OID 36239)
-- Name: daily_sales_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX daily_sales_date_key ON public.daily_sales USING btree (date);


--
-- TOC entry 5024 (class 1259 OID 36241)
-- Name: delivery_details_order_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX delivery_details_order_id_key ON public.delivery_details USING btree (order_id);


--
-- TOC entry 5027 (class 1259 OID 36242)
-- Name: ingredients_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ingredients_name_key ON public.ingredients USING btree (name);


--
-- TOC entry 5005 (class 1259 OID 36238)
-- Name: orders_order_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX orders_order_number_key ON public.orders USING btree (order_number);


--
-- TOC entry 5040 (class 1259 OID 36243)
-- Name: suppliers_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX suppliers_name_key ON public.suppliers USING btree (name);


--
-- TOC entry 5000 (class 1259 OID 36237)
-- Name: tables_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tables_number_key ON public.tables USING btree (number);


--
-- TOC entry 4997 (class 1259 OID 36236)
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- TOC entry 5051 (class 2606 OID 36279)
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5052 (class 2606 OID 36284)
-- Name: delivery_details delivery_details_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_details
    ADD CONSTRAINT delivery_details_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5053 (class 2606 OID 36289)
-- Name: delivery_details delivery_details_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_details
    ADD CONSTRAINT delivery_details_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5054 (class 2606 OID 36294)
-- Name: menu_item_modifiers menu_item_modifiers_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_item_modifiers
    ADD CONSTRAINT menu_item_modifiers_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5043 (class 2606 OID 36244)
-- Name: menu_items menu_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5050 (class 2606 OID 36274)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5047 (class 2606 OID 36259)
-- Name: order_items order_items_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5048 (class 2606 OID 36264)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5044 (class 2606 OID 36249)
-- Name: orders orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5045 (class 2606 OID 36794)
-- Name: orders orders_parent_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_parent_order_id_fkey FOREIGN KEY (parent_order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5046 (class 2606 OID 36254)
-- Name: orders orders_table_number_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_table_number_fkey FOREIGN KEY (table_number) REFERENCES public.tables(number) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5055 (class 2606 OID 36299)
-- Name: payment_transactions payment_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5056 (class 2606 OID 36304)
-- Name: purchase_order_items purchase_order_items_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5057 (class 2606 OID 36309)
-- Name: purchase_order_items purchase_order_items_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5058 (class 2606 OID 36314)
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5059 (class 2606 OID 36319)
-- Name: recipes recipes_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5060 (class 2606 OID 36324)
-- Name: recipes recipes_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5049 (class 2606 OID 36269)
-- Name: reservations reservations_table_number_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_table_number_fkey FOREIGN KEY (table_number) REFERENCES public.tables(number) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5234 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2026-02-11 16:01:11

--
-- PostgreSQL database dump complete
--

\unrestrict TdfXl0RQ2ebzWHE5xhyJZ5P0MtCOftzZFNlfRGEh4kC0gUqimE2zdZrFZFr1eSL

