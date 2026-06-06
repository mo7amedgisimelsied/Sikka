package com.sikka.backend_service.Repositories;

import com.sikka.backend_service.Models.TestTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestTableRepository extends JpaRepository<TestTable, Integer> {
    List<TestTable> findAll();
}
