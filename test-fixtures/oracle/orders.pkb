CREATE OR REPLACE PACKAGE BODY pkg_orders AS

  g_calls PLS_INTEGER := 0;

  -- helper prive, jamais declare dans la spec
  PROCEDURE log_msg(p_msg IN VARCHAR2) IS
  BEGIN
    DBMS_OUTPUT.put_line(p_msg);
  END log_msg;

  PROCEDURE create_order(
    p_customer_id IN  customers.customer_id%TYPE,
    p_total       IN  NUMBER DEFAULT 0,
    p_order_id    OUT NUMBER
  ) IS
    l_lines  PLS_INTEGER;
    l_status VARCHAR2(20) := 'NEW';
  BEGIN
    SELECT COUNT(*) INTO l_lines FROM order_lines WHERE customer_id = p_customer_id;
    IF l_lines > c_max_lines THEN
      RAISE e_closed;
    END IF;
    FOR r IN (SELECT order_id FROM orders WHERE customer_id = p_customer_id) LOOP
      UPDATE orders SET status = l_status WHERE order_id = r.order_id;
    END LOOP;
    INSERT INTO orders (customer_id, total) VALUES (p_customer_id, p_total)
      RETURNING order_id INTO p_order_id;
    g_last_id := p_order_id;
    log_msg('created ' || p_order_id);
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END create_order;

  FUNCTION get_status(p_order_id IN NUMBER) RETURN VARCHAR2 IS
    l_status orders.status%TYPE;
    FUNCTION label(p IN VARCHAR2) RETURN VARCHAR2 IS
    BEGIN
      RETURN CASE p WHEN 'N' THEN 'New' ELSE 'Other' END;
    END label;
  BEGIN
    SELECT status INTO l_status FROM orders WHERE order_id = p_order_id;
    RETURN label(l_status);
  END get_status;

  FUNCTION count_open RETURN PLS_INTEGER IS
    l_n PLS_INTEGER;
  BEGIN
    SELECT COUNT(*) INTO l_n FROM orders WHERE status = 'OPEN';
    RETURN l_n;
  END count_open;

  PROCEDURE close_order(p_order_id IN NUMBER) IS
  BEGIN
    UPDATE orders SET status = 'CLOSED' WHERE order_id = p_order_id;
    COMMIT;
  END close_order;

BEGIN
  g_calls := 0;
END pkg_orders;
/
